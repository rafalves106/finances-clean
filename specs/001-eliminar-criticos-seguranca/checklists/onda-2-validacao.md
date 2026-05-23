# Checklist de Validacao - Onda 2 (SEC-002)

Data de execucao: 2026-05-23
Status: CONCLUIDO (Onda 2)

## Escopo validado

- TASK-06: substituicao de `AllowAnyOrigin` por allowlist explicita com `WithOrigins`.
- TASK-07: fail fast para `CORS_ALLOWED_ORIGINS` em ambiente nao local.
- TASK-08: execucao dos checks auditaveis da Onda 2.

## Comandos auditaveis (plan §4)

1. Confirmar ausencia de AllowAnyOrigin:

```bash
grep -RIn 'AllowAnyOrigin' server/API/Program.cs
```

Resultado esperado: sem saida.
Resultado obtido: PASS (sem saida).

2. Confirmar presenca de WithOrigins:

```bash
grep -RIn 'WithOrigins' server/API/Program.cs
```

Resultado esperado: pelo menos uma ocorrencia valida com allowlist.
Resultado obtido: PASS (`server/API/Program.cs:108` com `WithOrigins(allowedOrigins)`).

3. Build de validacao:

```bash
dotnet build server/Finance.slnx
```

Resultado esperado: build concluido com sucesso.
Resultado obtido: PASS (build concluido com sucesso; 1 warning pre-existente fora do escopo SEC-002).

## Evidencias de implementacao

- `server/API/Program.cs` com resolucao de allowlist explicita e fail fast de `CORS_ALLOWED_ORIGINS` em ambiente nao local.
- `docker-compose.yml` com `CORS_ALLOWED_ORIGINS` no backend.
- `docs/runbooks/migrations-prod.md` atualizado com formato e regra operacional de CORS allowlist.

## Evidencias obrigatorias TASK-07 e TASK-08

1. Startup em ambiente nao local sem `CORS_ALLOWED_ORIGINS` (fail fast)

Comando executado:

```bash
ASPNETCORE_ENVIRONMENT=Production \
ASPNETCORE_URLS=http://127.0.0.1:5098 \
ConnectionStrings__PostgresConnection='Host=localhost;Port=5432;Database=FinanceDb;Username=falves;Password=falvesadm' \
Jwt__Key='chave-local-dev-minimo-32-caracteres!!' \
Jwt__Issuer='finance-api' \
Jwt__Audience='finance-app' \
AdminKey='admin-key-local' \
dotnet run --no-launch-profile --project server/API/API.csproj
```

Resultado obtido: PASS (fail fast acionado).

Trecho de evidência:

```text
Unhandled exception. System.InvalidOperationException: Configuracao invalida: CORS_ALLOWED_ORIGINS e obrigatoria em ambiente nao local.
```

2. Startup com `CORS_ALLOWED_ORIGINS` valida (API sobe)

Comando executado (resumo):

```bash
ASPNETCORE_ENVIRONMENT=Production \
ASPNETCORE_URLS=http://127.0.0.1:5099 \
... \
CORS_ALLOWED_ORIGINS='http://localhost:5173' \
dotnet run --no-launch-profile --project server/API/API.csproj
```

Resultado obtido: PASS.

Evidências:

```text
Now listening on: http://127.0.0.1:5099
Hosting environment: Production
```

Health check durante o teste:

```json
{ "status": "healthy", "timestamp": "2026-05-23T18:04:40.862804Z" }
```

3. Origem nao permitida bloqueada (sem `Access-Control-Allow-Origin`)

Teste executado com header `Origin: http://origem-nao-permitida.local`.

Headers de resposta capturados:

```text
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Date: Sat, 23 May 2026 18:04:40 GMT
Server: Kestrel
Transfer-Encoding: chunked
```

Resultado obtido: PASS (nao ha header `Access-Control-Allow-Origin` para origem nao permitida).

Observacao operacional:

- Este ambiente de execucao nao possui browser integrado para captura visual de DevTools.
- Como evidencia auditavel equivalente, foi registrada a captura de headers HTTP sem `Access-Control-Allow-Origin`, que e o criterio tecnico que faz o browser bloquear a resposta por CORS.
