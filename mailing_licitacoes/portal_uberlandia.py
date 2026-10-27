"""Coletor do WebLicitações de Uberlândia (rodar na SUA máquina: o site bloqueia IPs de servidor).
Percorre PE <n>/<ano>, salva o HTML de cada processo, baixa os anexos cujo link/nome sugere proposta
e extrai CNPJ, e-mails, telefones e representantes -> portal_uberlandia.csv.
  pip install requests beautifulsoup4 pandas ; (opcional) pdftotext/poppler para PDFs
  python portal_uberlandia.py --ano 2026 --modalidade PE --de 1 --ate 600
AVISO: a estrutura da página não foi vista por mim; se nada for baixado, abra data/uberlandia/html/PE_1_2026.html
e me envie para ajustar `ACHAR_ANEXOS`."""
import os, re, sys, time, argparse, subprocess, urllib.parse, requests, pandas as pd
from bs4 import BeautifulSoup
from common import *
from portal_firecrawl import extrair

BASE = "https://weblicitacoes.uberlandia.mg.gov.br/weblicitacoes/f/n/licitacoesdetalhescon"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}
ACHAR_ANEXOS = re.compile(r"propost|anexo|download|\.pdf|\.docx?|\.zip|arquivo", re.I)

def texto_arquivo(path):
    if path.lower().endswith(".pdf"):
        return subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True).stdout
    try: return open(path, errors="ignore").read()
    except Exception: return ""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ano", default="2026"); ap.add_argument("--modalidade", default="PE")
    ap.add_argument("--de", type=int, default=1); ap.add_argument("--ate", type=int, default=600)
    ap.add_argument("--vazios", type=int, default=25, help="para após N processos seguidos inexistentes")
    a = ap.parse_args()
    out = "data/uberlandia"; os.makedirs(f"{out}/html", exist_ok=True); os.makedirs(f"{out}/anexos", exist_ok=True)
    base = set(pd.read_csv("base_mailing.csv", sep=";", dtype=str, usecols=["doc"]).doc) if os.path.exists("base_mailing.csv") else set()
    s = requests.Session(); s.headers.update(UA)
    rows, vazios = [], 0
    for n in range(a.de, a.ate + 1):
        lic = f"{a.modalidade} {n}/{a.ano}"
        url = f"{BASE}?modoJanelaPlc=popup&evento=y&codigoEmpresa=1&licitacao={urllib.parse.quote(lic)}"
        try: r = s.get(url, timeout=40)
        except requests.RequestException as e: print(lic, "erro", e); continue
        if r.status_code == 403: sys.exit("403: o site bloqueou este IP. Rode de uma rede doméstica.")
        nome = f"{a.modalidade}_{n}_{a.ano}"
        open(f"{out}/html/{nome}.html", "wb").write(r.content)
        soup = BeautifulSoup(r.text, "html.parser")
        txt = soup.get_text(" ", strip=True)
        if r.status_code != 200 or len(txt) < 200 or re.search(r"n[ãa]o (foi )?encontrad|inexistente|sem resultado", txt, re.I):
            vazios += 1
            if vazios >= a.vazios: print("fim da sequência em", lic); break
            continue
        vazios = 0
        docs = [(txt, url)]
        for i, l in enumerate(soup.find_all("a", href=True)):
            alvo = urllib.parse.urljoin(url, l["href"])
            if not ACHAR_ANEXOS.search(alvo + " " + l.get_text()) or alvo.startswith("javascript"): continue
            try: d = s.get(alvo, timeout=60)
            except requests.RequestException: continue
            ct = d.headers.get("content-type", "")
            if d.status_code != 200 or "html" in ct and len(d.content) < 2000: continue
            ext = ".pdf" if "pdf" in ct else (".html" if "html" in ct else ".bin")
            p = f"{out}/anexos/{nome}_{i}{ext}"; open(p, "wb").write(d.content)
            docs.append((texto_arquivo(p), alvo)); time.sleep(0.5)
        for t, u in docs:
            for e in extrair(t):
                e.update(licitacao=lic, url=u, na_base="sim" if e["doc"] in base else "nao"); rows.append(e)
        print(lic, f"{len(docs)-1} anexos", flush=True); time.sleep(1)
    df = pd.DataFrame(rows)
    df.to_csv("portal_uberlandia.csv", sep=";", index=False, encoding="utf-8-sig")
    print(f"{len(df)} ocorrências -> portal_uberlandia.csv")

if __name__ == "__main__":
    main()
