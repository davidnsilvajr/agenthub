"""Varre o feed nacional de contratos do PNCP e guarda (em pncp_matches.jsonl) só os contratos cujo
fornecedor está na base_mailing.csv. Retomável (pncp_scan.state). Uso: python pncp_scan.py 20260101 20261027 [--workers 3]"""
import sys, json, os, time, argparse, datetime as dt, requests, pandas as pd
from concurrent.futures import ThreadPoolExecutor
from common import norm_cnpj

ap = argparse.ArgumentParser(); ap.add_argument("ini"); ap.add_argument("fim"); ap.add_argument("--workers", type=int, default=3)
a = ap.parse_args()
alvo = set(pd.read_csv("base_mailing.csv", sep=";", dtype=str, usecols=["doc"]).doc)
state = json.load(open("pncp_scan.state")) if os.path.exists("pncp_scan.state") else {}
BASE = "https://pncp.gov.br/api/consulta/v1/contratos"

def semanas(ini, fim):
    d, f = dt.datetime.strptime(ini, "%Y%m%d"), dt.datetime.strptime(fim, "%Y%m%d")
    while d <= f:
        e = min(d + dt.timedelta(days=6), f); yield d.strftime("%Y%m%d"), e.strftime("%Y%m%d"); d = e + dt.timedelta(days=1)

def get(prm):
    for i in range(5):
        try:
            r = requests.get(BASE, params=prm, timeout=60)
            if r.status_code == 200: return r.json()
            if r.status_code == 204: return {"data": [], "totalPaginas": 0}
        except requests.RequestException: pass
        time.sleep(3 * (i + 1))
    return None

def pagina(jp):
    i, f, p = jp
    j = get({"dataInicial": i, "dataFinal": f, "pagina": p, "tamanhoPagina": 500})
    return j

out = open("pncp_matches.jsonl", "a")
for i, f in semanas(a.ini, a.fim):
    k = f"{i}-{f}"
    if state.get(k) == "ok": continue
    j = get({"dataInicial": i, "dataFinal": f, "pagina": 1, "tamanhoPagina": 500})
    if j is None: print("falha", k, flush=True); continue
    tot = j.get("totalPaginas", 0); res = [j]
    with ThreadPoolExecutor(a.workers) as ex:
        res += list(ex.map(pagina, [(i, f, p) for p in range(2, tot + 1)]))
    falhou = any(r is None for r in res); n = 0
    for r in res:
        for c in (r or {}).get("data", []):
            if norm_cnpj(c.get("niFornecedor")) in alvo:
                out.write(json.dumps({k2: c.get(k2) for k2 in ("niFornecedor", "nomeRazaoSocialFornecedor", "valorGlobal", "objetoContrato", "orgaoEntidade", "unidadeOrgao", "anoContrato", "sequencialContrato", "dataAssinatura")}, ensure_ascii=False) + "\n"); n += 1
    out.flush()
    if not falhou: state[k] = "ok"; json.dump(state, open("pncp_scan.state", "w"))
    print(k, f"{tot} pag, {n} contratos da base", "(FALHOU, repetir)" if falhou else "", flush=True)
