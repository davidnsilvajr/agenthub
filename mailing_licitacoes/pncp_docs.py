"""Lê os PDFs dos contratos casados (pncp_matches.jsonl) e extrai e-mails, telefones e representantes
do fornecedor -> pncp_contatos.csv (com URL da fonte). Uso: python pncp_docs.py [--max-por-cnpj 2]"""
import json, re, subprocess, os, argparse, time, collections, requests, pandas as pd
from common import *

ap = argparse.ArgumentParser(); ap.add_argument("--max-por-cnpj", type=int, default=2); a = ap.parse_args()
rep_re = re.compile(r"(?:neste ato\s+)?representad[ao]\s+(?:legalmente\s+)?(?:por|pelo|pela)\s+(?:seu\s+|sua\s+)?(?:\w+\s+)?(?:s[óo]cio[- ]administrador[a]?\s+|diretor[a]?\s+|procurador[a]?\s+)?(?:o\s+|a\s+)?(?:sr\.?|sra\.?)?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç' ]{5,60}?)\s*[,;(]", re.I)
tel_re = re.compile(r"\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b")
done = set()
if os.path.exists("pncp_contatos.csv"):
    done = set(pd.read_csv("pncp_contatos.csv", sep=";", dtype=str).url.dropna())
por = collections.defaultdict(list)
for l in open("pncp_matches.jsonl"):
    c = json.loads(l); por[c["niFornecedor"]].append(c)
rows = []
def sv():
    pd.DataFrame(rows).to_csv("pncp_contatos.csv", sep=";", index=False, encoding="utf-8-sig", mode="a", header=not os.path.exists("pncp_contatos.csv"))
for n, (cnpj, cs) in enumerate(por.items(), 1):
    for c in sorted(cs, key=lambda x: -(x.get("valorGlobal") or 0))[: a.max_por_cnpj]:
        org = c["orgaoEntidade"]["cnpj"]; base = f"https://pncp.gov.br/api/pncp/v1/orgaos/{org}/contratos/{c['anoContrato']}/{c['sequencialContrato']}/arquivos"
        try:
            lst = requests.get(base, timeout=30).json()
        except Exception: continue
        for x in lst[:2]:
            u = x.get("url")
            if not u or u in done: continue
            try:
                r = requests.get(u, timeout=60)
                open("/tmp/_c.pdf", "wb").write(r.content)
                t = subprocess.run(["pdftotext", "-layout", "/tmp/_c.pdf", "-"], capture_output=True, text=True, timeout=60).stdout
            except Exception: continue
            # só trechos que falam do fornecedor (CONTRATADA) para não pegar e-mail do órgão
            i = max(t.upper().find("CONTRATAD"), 0); trecho = t[i: i + 6000]
            org_dom = {e.split("@")[1] for e in EMAIL_RE.findall(t[:i + 1]) if "@" in e}
            ems = [e.lower() for e in EMAIL_RE.findall(trecho) if clean_email(e) and e.split("@")[1].lower() not in org_dom and not e.lower().endswith((".gov.br", ".leg.br", ".jus.br"))]
            tels = [norm_phone(m) for m in tel_re.findall(trecho)]
            reps = [m.strip() for m in rep_re.findall(trecho)]
            if cnpj in digits(trecho) or ems or reps:
                rows.append({"doc": cnpj, "razao_social": c["nomeRazaoSocialFornecedor"], "emails_contrato": "; ".join(dict.fromkeys(ems)), "tels_contrato": "; ".join(dict.fromkeys(t for t in tels if t)),
                             "representante_contrato": "; ".join(dict.fromkeys(reps[:2])), "orgao": c["orgaoEntidade"].get("razaoSocial"), "valor": c.get("valorGlobal"), "url": u})
            time.sleep(0.5)
    if n % 25 == 0 and rows: sv(); rows = []; print(n, len(por), flush=True)
if rows: sv()
print("ok")
