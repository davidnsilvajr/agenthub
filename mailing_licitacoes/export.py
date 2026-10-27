"""Gera mailing_completo.xlsx a partir de base_mailing.csv + cache/ (pode rodar a qualquer momento)."""
import json, os, pandas as pd
from enrich import parse_cnpj, FREE
from common import *

df = pd.read_csv("base_mailing.csv", sep=";", dtype=str, encoding="utf-8-sig").fillna("")
rows = []
for r in df.to_dict("records"):
    p = f"cache/cnpj_{r['doc']}.json"
    r["consultado_receita"] = "sim" if os.path.exists(p) else "nao"
    if os.path.exists(p):
        i = parse_cnpj(json.load(open(p)))
        tels = [t for t in r["telefones"].split(" / ") if t] + i["tel_receita"]
        r["telefones"] = " / ".join(dict.fromkeys(tels))
        r["email"] = r["email"] or i["email_receita"]
        r["decisores_receita"] = "; ".join(i["socios"])
        r["situacao_cadastral"], r["cnae"], r["porte"], r["nome_fantasia"] = i["situacao"], i["cnae"], i["porte"], i["nome_fantasia"]
    dom = r["email"].split("@")[1] if "@" in r["email"] else ""
    sp = f"cache/site_{dom}.json"
    if dom and dom not in FREE and os.path.exists(sp):
        s = json.load(open(sp)); r["emails_site"] = "; ".join(s["emails"][:5]); r["tel_site"] = "; ".join(s["tels"][:3])
    rows.append(r)
out = pd.DataFrame(rows).fillna("")
out["decisor_principal"] = out.apply(lambda r: r.responsavel_licitacoes and f"{r.responsavel_licitacoes} ({r.cargo_responsavel})" or
                                     (r.decisores_receita.split("; ")[0] if r.decisores_receita else r.socios_administradores.split("; ")[0]), axis=1)
out["contato_ok"] = (out.email != "") | (out.emails_site != "") | (out.telefones != "")
pd.read_csv("base_mailing.csv", sep=";", dtype=str, nrows=0)
with pd.ExcelWriter("mailing_completo.xlsx") as w:
    out.to_excel(w, sheet_name="Mailing PJ", index=False)
    out[out.situacao_cadastral.str.upper().isin(["ATIVA", ""])].query("contato_ok").to_excel(w, sheet_name="Pronto p envio", index=False)
    pd.read_excel("base_mailing.xlsx", sheet_name="Contratos sem CNPJ").to_excel(w, sheet_name="Contratos sem CNPJ", index=False)
print(len(out), "linhas | consultadas:", (out.consultado_receita == "sim").sum(), "| com decisor:", (out.decisor_principal != "").sum(),
      "| com e-mail:", ((out.email != "") | (out.emails_site != "")).sum(), "| com telefone:", (out.telefones != "").sum())
