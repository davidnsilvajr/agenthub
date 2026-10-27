# Mailing de empresas que participam de licitações

1. `python build_base.py contratos.csv cadastro.xlsx .` → `base_mailing.xlsx/.csv` (já gerado; 14.041 CNPJs, 321 com contratos).
2. `python pncp_harvest.py 20260101 20261031 --ibge 3170206` → fornecedores com contratos no PNCP (amplia o universo).
3. `python enrich.py base_mailing.csv mailing_enriquecido.csv --prioridade A` (depois sem o filtro) → e-mail, telefones, sócios-administradores (Receita) e contatos do site.

Requer acesso a `pncp.gov.br`, `brasilapi.com.br`/`minhareceita.org` e aos sites das empresas.
Dados de pessoas (sócios) são públicos, mas o uso para prospecção exige base legal (LGPD, legítimo interesse B2B),
identificação do remetente e opção de descadastro em todo envio. Não use a aba PF/CPF.
