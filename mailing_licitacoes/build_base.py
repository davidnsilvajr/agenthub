"""Etapa 1 (offline): une a planilha de contratos (CSV) com o cadastro de fornecedores (XLSX)
e gera base_mailing.csv/xlsx deduplicada por CNPJ, pronta para enriquecimento.
Uso: python build_base.py <contratos.csv> <cadastro.xlsx> [saida_dir]"""
import sys, os
import pandas as pd
from common import *

csv_path, xlsx_path = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else "."

c = pd.read_csv(csv_path, sep=";", encoding="latin1", dtype=str).fillna("")
x = pd.read_excel(xlsx_path, header=None, dtype=str).fillna("")
x.columns = ["razao_social", "endereco", "cidade", "uf", "tel_a", "tel_b", "tel_c", "doc"]

def pick_phones(*vals):
    seen = []
    for v in vals:
        p = norm_phone(v)
        if p and p not in seen:
            seen.append(p)
    return seen

# --- cadastro (universo amplo) ---
x["doc"] = x["doc"].map(norm_cnpj)
x["tipo_doc"] = x["doc"].map(kind)
cad = x.drop_duplicates("doc").copy()
cad["telefones"] = [" / ".join(pick_phones(a, b, c_)) for a, b, c_ in zip(cad.tel_a, cad.tel_b, cad.tel_c)]
cad["fonte"] = "Cadastro de fornecedores"

# --- contratos (prioridade alta: quem de fato contrata) ---
c["doc"] = c["CNPJ_CHAVE"].map(norm_cnpj)
cc = pd.DataFrame({
    "doc": c["doc"],
    "razao_social_contrato": c["Fornecedor"],
    "n_contratos": c["Nº contratos (únicos)"],
    "valor_total_contratado": c["Valor total contratado (R$)"],
    "orgao_contratante": c["Órgão contratante (1º contrato)"],
    "objeto": c["Objeto (1º contrato)"],
    "email_pesquisa": c["E-mail (pesquisa web)"].map(clean_email),
    "email_alternativo": c["E-mail alternativo (cadastro Receita / contabilidade)"].map(clean_email),
    "tel_pesquisa": c["Telefone (pesquisa web)"].map(norm_phone),
    "responsavel_licitacoes": c["Responsável em licitações / contratos (nome)"],
    "cargo_responsavel": c["Cargo"],
    "nivel_evidencia": c["Nível de evidência"],
    "socios_administradores": c["Representante legal (sócios-administradores, Receita)"],
    "obs_fonte": c["Observação / fonte da pesquisa"],
})
# fornecedores do CSV sem CNPJ ficam de fora do mailing, mas vão para a aba de pendências
sem_doc = cc[cc.doc == ""].copy()
cc = cc[cc.doc != ""].drop_duplicates("doc")

base = cad.merge(cc, on="doc", how="outer")
base["razao_social"] = base["razao_social"].where(base["razao_social"].astype(bool), base["razao_social_contrato"])
base["fonte"] = base["fonte"].fillna("Contratos 2026")
base["tipo_doc"] = base["doc"].map(kind)
base["email"] = base["email_pesquisa"].fillna("")
base["email"] = base["email"].where(base["email"] != "", base["email_alternativo"].fillna(""))
base["telefones"] = base.apply(lambda r: " / ".join(dict.fromkeys(
    [p for p in [r.get("tel_pesquisa", ""), r.get("telefones", "")] if isinstance(p, str) and p for p in p.split(" / ")])), axis=1)
base["mei"] = base["razao_social"].str.contains(r"\bMEI\b|\d{2}\.\d{3}\.\d{3}\s*$", regex=True, na=False)
base["prioridade"] = base["n_contratos"].notna().map({True: "A - contrata com o poder público", False: "B - cadastrado como fornecedor"})
base["tem_decisor"] = base["responsavel_licitacoes"].fillna("").ne("") | base["socios_administradores"].fillna("").ne("")
base["pendente_enriquecimento"] = (base.tipo_doc == "CNPJ") & (base.email == "")

cols = ["prioridade", "doc", "tipo_doc", "razao_social", "cidade", "uf", "endereco", "telefones", "email",
        "responsavel_licitacoes", "cargo_responsavel", "nivel_evidencia", "socios_administradores",
        "n_contratos", "valor_total_contratado", "orgao_contratante", "objeto", "obs_fonte", "fonte", "pendente_enriquecimento"]
base = base[cols].sort_values(["prioridade", "razao_social"]).reset_index(drop=True)
pj = base[base.tipo_doc == "CNPJ"]
os.makedirs(out, exist_ok=True)
pj.to_csv(f"{out}/base_mailing.csv", index=False, sep=";", encoding="utf-8-sig")
with pd.ExcelWriter(f"{out}/base_mailing.xlsx") as w:
    pj.to_excel(w, sheet_name="Mailing PJ", index=False)
    base[base.tipo_doc != "CNPJ"].to_excel(w, sheet_name="PF-CPF (nao enviar)", index=False)
    sem_doc.to_excel(w, sheet_name="Contratos sem CNPJ", index=False)
print(f"CNPJs: {len(pj)} | prioridade A: {(pj.prioridade.str[0]=='A').sum()} | com e-mail: {(pj.email!='').sum()} | "
      f"com telefone: {(pj.telefones!='').sum()} | com decisor/sócios: {pj.responsavel_licitacoes.fillna('').ne('').sum()+pj.socios_administradores.fillna('').ne('').sum()} | "
      f"pendentes: {pj.pendente_enriquecimento.sum()} | PF/CPF: {(base.tipo_doc!='CNPJ').sum()} | sem CNPJ: {len(sem_doc)}")
