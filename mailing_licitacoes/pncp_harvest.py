"""Coleta fornecedores com contratos no PNCP (API pública de consulta), por janela de datas,
opcionalmente filtrando por município (código IBGE) ou UF. Gera pncp_fornecedores.csv
(CNPJ, razão social, nº de contratos, valor, órgãos) para somar ao universo do mailing.
  python pncp_harvest.py 20260101 20261031 [--ibge 3170206] [--max-paginas 200]"""
import argparse, time, collections, requests, pandas as pd
from common import norm_cnpj

BASE = "https://pncp.gov.br/api/consulta/v1/contratos"

def pagina(params, tries=4):
    for i in range(tries):
        try:
            r = requests.get(BASE, params=params, timeout=40)
            if r.status_code == 200:
                return r.json()
            if r.status_code == 204:
                return {"data": [], "totalPaginas": 0}
        except requests.RequestException:
            pass
        time.sleep(3 * (i + 1))
    return {"data": [], "totalPaginas": 0}

ap = argparse.ArgumentParser()
ap.add_argument("ini"); ap.add_argument("fim")
ap.add_argument("--ibge"); ap.add_argument("--max-paginas", type=int, default=200)
a = ap.parse_args()

agg = collections.defaultdict(lambda: {"nome": "", "n": 0, "valor": 0.0, "orgaos": set(), "uf": "", "cidade": ""})
p = 1
while p <= a.max_paginas:
    prm = {"dataInicial": a.ini, "dataFinal": a.fim, "pagina": p, "tamanhoPagina": 500}
    if a.ibge:
        prm["codigoMunicipioIbge"] = a.ibge
    j = pagina(prm)
    for c in j.get("data", []):
        if c.get("tipoPessoa") not in (None, "PJ"):
            continue
        d = norm_cnpj(c.get("niFornecedor"))
        if len(d) != 14:
            continue
        r = agg[d]
        r["nome"] = c.get("nomeRazaoSocialFornecedor") or r["nome"]
        r["n"] += 1; r["valor"] += float(c.get("valorGlobal") or 0)
        o = c.get("orgaoEntidade") or {}
        r["orgaos"].add(o.get("razaoSocial", ""))
        u = c.get("unidadeOrgao") or {}
        r["uf"], r["cidade"] = u.get("ufSigla", r["uf"]), u.get("municipioNome", r["cidade"])
    print(f"pagina {p}/{j.get('totalPaginas', 0)} - {len(agg)} fornecedores", flush=True)
    if p >= j.get("totalPaginas", 0):
        break
    p += 1; time.sleep(0.5)

pd.DataFrame([{"doc": d, "razao_social": r["nome"], "cidade": r["cidade"], "uf": r["uf"], "n_contratos": r["n"],
               "valor_total_contratado": round(r["valor"], 2), "orgao_contratante": " | ".join(sorted(r["orgaos"]))[:300]}
              for d, r in agg.items()]).to_csv("pncp_fornecedores.csv", sep=";", index=False, encoding="utf-8-sig")
