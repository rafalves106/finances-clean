# Migrations em producao

Este projeto aplica migrations automaticamente apenas em `Development`.
Em producao, a aplicacao assume que o schema ja foi atualizado manualmente antes de receber trafego.

## Quando rodar

Rode a migration manual sempre que houver uma nova migration no repositorio antes de subir a nova versao da API.

## Pre-requisitos

- Docker e Docker Compose instalados no servidor
- Variaveis de ambiente do backend configuradas
- Banco PostgreSQL acessivel a partir do host ou do container

Variaveis obrigatorias no backend:

- `ConnectionStrings__PostgresConnection`
- `Jwt__Key` (minimo recomendado: 32 caracteres)
- `AdminKey`
- `AllowedOrigins__0` (primeira origem permitida em ambiente nao local)

Opcional para multiplas origens:

- `AllowedOrigins__1`
- `AllowedOrigins__2`
- ...

## Opcao 1: rodar no host com .NET SDK

Na raiz de `server/`:

```bash
dotnet ef database update --project Infrastructure --startup-project API
```

## Opcao 2: rodar dentro de um container temporario

Se o servidor nao tiver o .NET SDK instalado, use um container do SDK montando o codigo da aplicacao:

```bash
docker run --rm \
  --network host \
  -v "$(pwd)/server:/src" \
  -w /src \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  dotnet ef database update --project Infrastructure --startup-project API
```

Se o servidor nao suportar `--network host`, ajuste a `ConnectionStrings__PostgresConnection` para apontar para o host correto do banco.

## Validacao

Depois de aplicar a migration:

```bash
curl -f http://localhost:8080/ready
```

Resposta esperada:

```json
{ "status": "ready", "timestamp": "..." }
```

## CORS allowlist explicita (SEC-002)

A API le a secao de configuracao `AllowedOrigins`.
Em variaveis de ambiente, isso significa usar chaves indexadas (`AllowedOrigins__N`).

Observacao importante:

- `CORS_ALLOWED_ORIGINS` nao e lida pelo codigo atual da API.

Formato esperado:

```bash
AllowedOrigins__0=https://financas.seu-dominio.com
AllowedOrigins__1=https://app.seu-dominio.com
```

Comportamento de startup:

- Ambiente nao local (`Production`, `Staging`, etc.): a secao `AllowedOrigins` e obrigatoria (fail fast se vazia/ausente).
- Ambiente local (`Development`): aceita fallback para `http://localhost:5173`.

## Rollback

Se a migration falhar, nao suba a nova versao da API. Corrija a migration ou restaure o backup do banco antes de tentar novamente.

## Sincronizacao pos-rewrite de historico (servidor caseiro)

Quando houver `force push` por limpeza de historico, o servidor caseiro deve ser
ressincronizado por re-clone limpo.

### Janela operacional recomendada

1. Definir janela de manutencao (downtime estimado: 10-20 min).
2. Comunicar congelamento de deploy/merge durante a janela.
3. Garantir backup local do workspace atual e dos volumes do banco.

### Procedimento de re-clone seguro

```bash
# no servidor caseiro
mv Finances Finances.pre-rewrite.$(date +%Y%m%d-%H%M%S)
git clone https://github.com/rafalves106/Finances.git Finances
cd Finances
```

### Validacao minima pos-sincronizacao

```bash
dotnet build server/Finance.slnx
curl -f http://localhost:8080/health
curl -f http://localhost:8080/ready
```

### Plano de retorno (rollback)

```bash
# no servidor caseiro
rm -rf Finances
mv Finances.pre-rewrite.<timestamp> Finances
cd Finances
```

Observacao: em caso de rollback para snapshot antigo, manter segredos rotacionados
e nao reativar credenciais previamente comprometidas.
