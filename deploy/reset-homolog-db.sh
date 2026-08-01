#!/usr/bin/env bash
set -euo pipefail

PROD_DIR="/home/falves/finance-clean-next"
HML_DIR="/home/falves/finance-hml"
DUMP_PATH="/tmp/finance-prod-$(date +%Y%m%d-%H%M%S).dump"
LOG_PREFIX="[reset-homolog-db]"

cleanup() {
  rm -f "$DUMP_PATH"
}
trap cleanup EXIT

echo "$LOG_PREFIX $(date -Iseconds) Iniciando reset semanal da base de homologacao."

# Le credenciais da prod e de homolog em subshells isoladas, pra nao
# misturar variaveis com o mesmo nome (DB_USER, DB_NAME, etc) entre os dois .env.
PROD_DB_USER=$(grep -E '^DB_USER=' "$PROD_DIR/.env" | cut -d= -f2-)
PROD_DB_NAME=$(grep -E '^DB_NAME=' "$PROD_DIR/.env" | cut -d= -f2-)
HML_DB_USER=$(grep -E '^DB_USER=' "$HML_DIR/.env" | cut -d= -f2-)
HML_DB_NAME=$(grep -E '^DB_NAME=' "$HML_DIR/.env" | cut -d= -f2-)

echo "$LOG_PREFIX Gerando dump da producao ($PROD_DB_NAME)..."
docker exec finance_db pg_dump -U "$PROD_DB_USER" -Fc "$PROD_DB_NAME" > "$DUMP_PATH"

echo "$LOG_PREFIX Parando backend de homologacao..."
docker stop finance_hml_backend

echo "$LOG_PREFIX Restaurando dump na base de homologacao ($HML_DB_NAME)..."
docker exec -i finance_hml_db pg_restore --clean --if-exists --no-owner -U "$HML_DB_USER" -d "$HML_DB_NAME" < "$DUMP_PATH" || true
# pg_restore retorna exit code != 0 se algum DROP falhar em objeto que nao existia ainda
# (normal na primeira execucao) - por isso o '|| true'; erros reais de restore
# aparecem no log mesmo assim, so nao derrubam o script.

echo "$LOG_PREFIX Reiniciando backend de homologacao..."
docker start finance_hml_backend

echo "$LOG_PREFIX $(date -Iseconds) Reset concluido com sucesso."
