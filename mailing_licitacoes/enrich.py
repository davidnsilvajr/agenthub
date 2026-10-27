"""Etapa 2 (precisa de internet): enriquece base_mailing.csv.
  1) Dados cadastrais abertos da Receita por CNPJ (BrasilAPI; fallback minhareceita.org):
     e-mail, telefones, sócios/administradores (QSA, dado público).
  2) Site da empresa (derivado do domínio do e-mail): e-mails/telefones de contato e
     caixas por função (licitacao@, comercial@, contratos@...).
Retomável (cache em cache/), com limite de taxa. Uso:
  python enrich.py base_mailing.csv saida.csv [--limit N] [--prioridade A] [--sem-site]"""
import sys, os, json, time, re, argparse
import requests, pandas as pd
from bs4 import BeautifulSoup
from common import *

UA = {"User-Agent": "Mozilla/5.0 (compatible; mailing-licitacoes/1.0)"}
FREE = {"gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.br", "uol.com.br", "bol.com.br",
        "terra.com.br", "icloud.com", "live.com", "msn.com", "ig.com.br", "globo.com"}
CARGOS_DECISOR = re.compile(r"(administrador|diretor|presidente|s[óo]cio|procurador)", re.I)
os.makedirs("cache", exist_ok=True)

def cached(key, fn):
    p = f"cache/{key}.json"
    if os.path.exists(p):
        return json.load(open(p))
    v = fn()
    json.dump(v, open(p, "w"), ensure_ascii=False)
    return v

def get(url, tries=3, **kw):
    for i in range(tries):
        try:
            r = requests.get(url, headers=UA, timeout=20, **kw)
            if r.status_code == 429:
                time.sleep(5 * (i + 1)); continue
            return r
        except requests.RequestException:
            time.sleep(2 * (i + 1))
    return None

def cnpj_lookup(cnpj):
    for url in (f"https://brasilapi.com.br/api/cnpj/v1/{cnpj}", f"https://minhareceita.org/{cnpj}"):
        r = get(url)
        if r is not None and r.status_code == 200:
            return r.json()
        time.sleep(1)
    return {}

def parse_cnpj(j):
    tels = [norm_phone(j.get(k)) for k in ("ddd_telefone_1", "ddd_telefone_2")]
    socios = []
    for s in j.get("qsa") or []:
        nome = s.get("nome_socio") or s.get("nome") or ""
        qual = s.get("qualificacao_socio") or s.get("qualificacao_do_socio") or ""
        if nome and CARGOS_DECISOR.search(qual):
            socios.append(f"{nome.title()} ({qual})")
    return {"email_receita": clean_email(j.get("email")), "tel_receita": [t for t in tels if t],
            "socios": socios, "nome_fantasia": j.get("nome_fantasia") or "", "situacao": j.get("descricao_situacao_cadastral") or "",
            "cnae": j.get("cnae_fiscal_descricao") or "", "porte": j.get("porte") or j.get("descricao_porte") or ""}

def scrape_site(domain):
    out = {"emails": [], "tels": []}
    for path in ("", "/contato", "/fale-conosco", "/licitacoes", "/licitacao"):
        r = get(f"https://{domain}{path}", tries=1)
        if r is None or r.status_code != 200 or "text/html" not in r.headers.get("content-type", ""):
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        txt = soup.get_text(" ") + " " + " ".join(a.get("href", "") for a in soup.find_all("a"))
        for e in EMAIL_RE.findall(txt):
            e = clean_email(e)
            if e and e.split("@")[1].endswith(domain.split(".", 1)[-1] if domain.count(".") > 1 else domain) and e not in out["emails"]:
                out["emails"].append(e)
        for t in re.findall(r"\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}", txt):
            t = norm_phone(t)
            if t and t not in out["tels"]:
                out["tels"].append(t)
        time.sleep(1)
    out["emails"].sort(key=lambda e: 0 if ROLE_RE.search(e.split("@")[0]) else 1)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada"); ap.add_argument("saida")
    ap.add_argument("--limit", type=int); ap.add_argument("--prioridade", default="")
    ap.add_argument("--sem-site", action="store_true"); ap.add_argument("--pausa", type=float, default=0.4)
    a = ap.parse_args()
    df = pd.read_csv(a.entrada, sep=";", dtype=str, encoding="utf-8-sig").fillna("")
    for col in ("emails_site", "tel_site", "decisores_receita", "situacao_cadastral", "cnae", "porte", "nome_fantasia"):
        df[col] = df.get(col, "")
    sel = df.index[df.doc.str.len().eq(14)]
    if a.prioridade:
        sel = [i for i in sel if df.at[i, "prioridade"].startswith(a.prioridade)]
    if a.limit:
        sel = list(sel)[: a.limit]
    for n, i in enumerate(sel, 1):
        doc = df.at[i, "doc"]
        info = parse_cnpj(cached(f"cnpj_{doc}", lambda: cnpj_lookup(doc)))
        time.sleep(a.pausa)
        if info["email_receita"] and not df.at[i, "email"]:
            df.at[i, "email"] = info["email_receita"]
        tels = [t for t in df.at[i, "telefones"].split(" / ") if t]
        df.at[i, "telefones"] = " / ".join(dict.fromkeys(tels + info["tel_receita"]))
        df.at[i, "decisores_receita"] = "; ".join(info["socios"])
        for k_df, k in (("situacao_cadastral", "situacao"), ("cnae", "cnae"), ("porte", "porte"), ("nome_fantasia", "nome_fantasia")):
            df.at[i, k_df] = info[k]
        email = df.at[i, "email"]
        dom = email.split("@")[1] if "@" in email else ""
        if dom and dom not in FREE and not a.sem_site:
            s = cached(f"site_{dom}", lambda: scrape_site(dom))
            df.at[i, "emails_site"] = "; ".join(s["emails"][:5])
            df.at[i, "tel_site"] = "; ".join(s["tels"][:3])
        if n % 50 == 0:
            df.to_csv(a.saida, sep=";", index=False, encoding="utf-8-sig"); print(f"{n}/{len(sel)}", flush=True)
    df.to_csv(a.saida, sep=";", index=False, encoding="utf-8-sig")
    print("ok", a.saida)

if __name__ == "__main__":
    main()
