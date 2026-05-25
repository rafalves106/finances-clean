# Finances

Aplicacao web full-stack para controle de financas pessoais, com foco em movimentacoes, investimentos, metas e custos de veiculos.

## Audiencia

- Dev novo: colocar o sistema para rodar localmente em poucos minutos.
- PO: entender rapidamente o escopo tecnico e onde validar operacao.

## Stack

- Frontend: React + Vite (pasta client)
- Backend: ASP.NET Core Web API (.NET 10, pasta server)
- Banco: PostgreSQL 16
- Orquestracao local: Docker Compose

## Quickstart full-stack com Docker Compose

1. Pre-requisitos:

- Docker
- Docker Compose

2. Configure arquivos de ambiente:

- Frontend: copie [client/.env.example](client/.env.example) para client/.env
- Docker Compose (raiz): crie arquivo .env na raiz com as variaveis obrigatorias abaixo

3. Suba o ambiente:

docker compose up --build

4. Acesse:

- Frontend: http://localhost:5173
- Backend (Swagger): http://localhost:8080/swagger
- Health: http://localhost:8080/health
- Ready: http://localhost:8080/ready

5. Para derrubar o ambiente:

docker compose down

Opcional (remover volumes locais do banco):

docker compose down -v

## Variaveis obrigatorias

Base de referencia:

- [client/.env.example](client/.env.example) para frontend
- [docker-compose.yml](docker-compose.yml) para execucao full-stack local
- [docs/runbooks/migrations-prod.md](docs/runbooks/migrations-prod.md) para operacao fora de Development

### Obrigatorias para Docker Compose local

Defina no arquivo .env da raiz:

- ADMIN_KEY

Variaveis recomendadas (evitar fallback padrao):

- JWT_KEY
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_EXPIRY_MINUTES

### Obrigatorias fora de ambiente local (Production/Staging)

Conforme runbook e comportamento atual da API, configure:

- ConnectionStrings\_\_PostgresConnection
- Jwt\_\_Key
- AdminKey
- AllowedOrigins**0 (e AllowedOrigins**1, AllowedOrigins\_\_2... se necessario)

Observacao importante:

- O codigo atual da API le AllowedOrigins indexado, nao CORS_ALLOWED_ORIGINS.

## Rodar em dev sem Docker

## 1) Banco de dados

Suba um PostgreSQL local (instalado no host ou container avulso) e anote a string de conexao.

## 2) Backend (.NET)

Na pasta server, execute com variaveis de ambiente:

ASPNETCORE_ENVIRONMENT=Development \
ConnectionStrings**PostgresConnection="Host=localhost;Port=5432;Database=FinanceDb;Username=SEU_USUARIO;Password=SUA_SENHA" \
Jwt**Key="SUA_CHAVE_COM_NO_MINIMO_32_CARACTERES" \
Jwt**Issuer="finance-api" \
Jwt**Audience="finance-app" \
Jwt**ExpiryMinutes="60" \
AdminKey="SUA_CHAVE_ADMIN" \
AllowedOrigins**0="http://localhost:5173" \
dotnet run --project API/API.csproj

API local padrao (launch profile): http://localhost:5010

## 3) Frontend (Vite)

Na pasta client:

- copie [client/.env.example](client/.env.example) para client/.env
- ajuste VITE_PROXY_TARGET para http://localhost:5010
- execute npm install
- execute npm run dev

Frontend local: http://localhost:5173

## Runbooks

- Migrations em producao: [docs/runbooks/migrations-prod.md](docs/runbooks/migrations-prod.md)

## Documentacao adicional

- Mapa do projeto: [PROJECT_MAP.md](PROJECT_MAP.md)
- ADR SEC-014 (rate limiter): [docs/adr/2026-05-23-sec014-rate-limiter-hardening.md](docs/adr/2026-05-23-sec014-rate-limiter-hardening.md)
- Plano do ciclo de seguranca: [specs/001-eliminar-criticos-seguranca/plan.md](specs/001-eliminar-criticos-seguranca/plan.md)
