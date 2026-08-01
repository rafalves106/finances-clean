# Ambiente de homologação

Checkout separado em `/home/falves/finance-hml` no servidor, rastreando a
branch `develop` (produção continua em `/home/falves/finance-clean-next`,
branch `main`). Acessível em `https://hml-finance.falveshub.com` via tunnel
Cloudflare dedicado.

## Isolamento de produção

- Containers próprios: `finance_hml_db`, `finance_hml_backend`,
  `finance_hml_frontend` (nunca compartilham nome com os de produção).
- Volume próprio: `finance-hml_postgres_data_hml`.
- Portas no host: DB `5433`, backend `8082`, frontend `5174` — nunca as
  mesmas de produção (`5432`/`8080`/`5173`).
- `.env` com `DB_PASSWORD`/`JWT_KEY`/`ADMIN_KEY`/`ACTIVATION_CODE` próprios,
  gerados via `openssl rand`, distintos dos de produção.

Essas diferenças (nome de container, porta, volume) vivem em
`docker-compose.override.yml` — **não versionado** (fica só no checkout de
homolog do servidor). O `docker-compose.yml` em si é o mesmo arquivo do
repo, sem edição, pra `git pull` nunca dar conflito.

## Redeploy após novo commit em `develop`

```bash
cd /home/falves/finance-hml
git pull origin develop
docker compose build
docker compose up -d
```

## Reset semanal do banco (clona produção)

`reset-homolog-db.sh` (este diretório) roda via cron toda segunda às 4h,
direto do checkout de homolog (fica versionado, sem cópia solta no servidor):

```
0 4 * * 1 /home/falves/finance-hml/deploy/reset-homolog-db.sh >> /home/falves/finance-hml/deploy/reset-homolog-db.log 2>&1
```

Faz `pg_dump` da produção (`finance_db`), para o backend de homolog,
restaura com `pg_restore --clean` na base de homolog e reinicia o backend.
Pode ser rodado manualmente a qualquer momento com o mesmo comando.

**Nota**: `docker exec finance_db pg_dump` exige que o script rode na
mesma máquina que os dois checkouts (produção e homolog) — não é portável
para múltiplos hosts sem adaptação.
