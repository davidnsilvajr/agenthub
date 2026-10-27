"""Busca arquivos de PROPOSTAS em portais de licitação de órgãos via Firecrawl (API hospedada,
https://github.com/firecrawl/firecrawl) e extrai CNPJ, e-mails, telefones e representantes.
Precisa de FIRECRAWL_API_KEY no ambiente (FIRECRAWL_URL opcional p/ instância self-hosted).
  python portal_firecrawl.py https://www.uberlandia.mg.gov.br/licitacoes-e-contratos-2/ [--busca proposta] [--max 300]
Saída: portal_propostas.csv (uma linha por CNPJ encontrado em cada documento, com a URL de origem)."""
import os, re, json, sys, time, hashlib, argparse, requests, pandas as pd
from common import *

API = os.environ.get("FIRECRAWL_URL", "https://api.firecrawl.dev").rstrip("/")
KEY = os.environ.get("FIRECRAWL_API_KEY", "")
H = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
CNPJ_RE = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")
REP_RE = re.compile(r"(?:representad[ao]|neste ato|respons[áa]vel(?: legal| t[ée]cnico)?|procurador[a]?|s[óo]cio[- ]administrador[a]?|assinad[ao] por)\s*(?:por|pel[oa]|:)?\s*(?:o\s+|a\s+)?(?:sr\.?\s*|sra\.?\s*)?([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç']+(?:\s+(?:d[aeo]s?\s+)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç']+){1,5})")
TEL_RE = re.compile(r"\(?\b\d{2}\)?\s?9?\d{4}[-\s.]?\d{4}\b")
os.makedirs("cache/fc", exist_ok=True)

def post(path, body, tries=4):
    for i in range(tries):
        r = requests.post(f"{API}{path}", headers=H, json=body, timeout=180)
        if r.status_code == 429: time.sleep(10 * (i + 1)); continue
        if r.status_code >= 500: time.sleep(5); continue
        return r.json()
    return {}

def scrape(url):
    p = f"cache/fc/{hashlib.md5(url.encode()).hexdigest()}.json"
    if os.path.exists(p): return json.load(open(p))
    j = post("/v1/scrape", {"url": url, "formats": ["markdown", "links"], "timeout": 120000})
    d = j.get("data") or {}
    out = {"markdown": d.get("markdown", ""), "links": d.get("links", []), "erro": "" if j.get("success") else str(j.get("error", ""))[:200]}
    json.dump(out, open(p, "w"), ensure_ascii=False)
    return out

def mapear(url, busca, limite):
    j = post("/v1/map", {"url": url, "search": busca, "limit": limite, "includeSubdomains": True})
    return [l if isinstance(l, str) else l.get("url", "") for l in j.get("links", [])]

def extrair(texto):
    """Divide o documento por CNPJ: contatos próximos a cada CNPJ (fornecedor) ficam atribuídos a ele."""
    res = []
    for m in CNPJ_RE.finditer(texto):
        doc = digits(m.group()); trecho = texto[max(0, m.start() - 1500): m.end() + 2500]
        ems = [clean_email(e) for e in EMAIL_RE.findall(trecho)]
        ems = [e for e in ems if e and not e.endswith((".gov.br", ".leg.br", ".jus.br", ".mp.br"))]
        res.append({"doc": doc, "emails": "; ".join(dict.fromkeys(ems)),
                    "telefones": "; ".join(dict.fromkeys(t for t in map(norm_phone, TEL_RE.findall(trecho)) if t)),
                    "representantes": "; ".join(dict.fromkeys(r.strip() for r in REP_RE.findall(trecho)[:3]))})
    return res

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("url")
    ap.add_argument("--busca", default="proposta"); ap.add_argument("--max", type=int, default=300)
    ap.add_argument("--profundidade", type=int, default=2)
    a = ap.parse_args()
    if not KEY and "api.firecrawl.dev" in API: sys.exit("Defina FIRECRAWL_API_KEY (ou FIRECRAWL_URL de uma instância self-hosted).")
    base = set(pd.read_csv("base_mailing.csv", sep=";", dtype=str, usecols=["doc"]).doc)
    alvo = re.compile(a.busca, re.I)
    # 1) mapa do site filtrado pela busca + 2) navegação a partir da página inicial
    fila, vistos, docs = [a.url] + mapear(a.url, a.busca, a.max * 5), set(), []
    for prof in range(a.profundidade + 1):
        prox = []
        for u in fila:
            if u in vistos or len(vistos) >= a.max * 3: continue
            vistos.add(u)
            if alvo.search(u) or u.lower().endswith((".pdf", ".doc", ".docx")) and alvo.search(u):
                docs.append(u); continue
            pg = scrape(u)
            if pg["erro"]: print("erro", u, pg["erro"], flush=True)
            prox += [l for l in pg["links"] if alvo.search(l) or re.search(r"licita|pregao|preg%C3%A3o|edital|processo|anexo", l, re.I)]
        fila = prox
    docs = list(dict.fromkeys(docs))[: a.max]
    print(f"{len(vistos)} páginas visitadas, {len(docs)} documentos de '{a.busca}'", flush=True)
    rows = []
    for i, u in enumerate(docs, 1):
        d = scrape(u)
        for r in extrair(d["markdown"]):
            r.update(url=u, na_base="sim" if r["doc"] in base else "nao"); rows.append(r)
        if i % 20 == 0: print(i, len(docs), flush=True)
    df = pd.DataFrame(rows, columns=["doc", "na_base", "emails", "telefones", "representantes", "url"])
    df.to_csv("portal_propostas.csv", sep=";", index=False, encoding="utf-8-sig",
              mode="a", header=not os.path.exists("portal_propostas.csv"))
    print(f"ok: {len(df)} ocorrências de CNPJ, {df.doc.nunique() if len(df) else 0} empresas, "
          f"{(df.na_base == 'sim').sum() if len(df) else 0} já na base -> portal_propostas.csv")

if __name__ == "__main__":
    main()
