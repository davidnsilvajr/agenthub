import re

def digits(s):
    return re.sub(r"\D", "", str(s or ""))

def norm_cnpj(s):
    d = digits(s)
    return d.zfill(14) if len(d) in (13, 14) else (d.zfill(11) if len(d) in (10, 11) else d)

def kind(doc):
    return {14: "CNPJ", 11: "CPF"}.get(len(doc), "invalido")

def norm_phone(s):
    """Normaliza telefone BR: devolve '(DD) NNNN-NNNN' ou '' se for lixo (ex.: '3434')."""
    d = digits(s)
    d = d.lstrip("0")
    if len(d) < 10 or d[:2] == "00":   # sem DDD ou lixo ('3434', '01111111'): descartado
        return ""
    if len(d) == 10:
        return f"({d[:2]}) {d[2:6]}-{d[6:]}"
    if len(d) == 11 and d[2] == "9":
        return f"({d[:2]}) {d[2:7]}-{d[7:]}"
    return ""

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
GENERIC_BAD = re.compile(r"(sentry|wixpress|example|\.png|\.jpg|\.gif|noreply|no-reply)", re.I)
ROLE_RE = re.compile(r"(licita|pregao|pregão|contrato|propost|comercial|vendas|suprimento|compras|orcament|orçament|diretoria|financeiro)", re.I)

def clean_email(s):
    s = str(s or "").strip().lower()
    return s if EMAIL_RE.fullmatch(s) and not GENERIC_BAD.search(s) else ""
