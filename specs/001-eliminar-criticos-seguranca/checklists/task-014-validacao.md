# TASK-014 - Validacao de Protecao Contra Abuso em Auth (SEC-014)

Data: 2026-05-23
Status: ENCERRADO (GO)

## Escopo validado

- Rate limiting aplicado apenas nos endpoints publicos de auth (`/api/v1/auth/login` e `/api/v1/auth/registro`).
- Telemetria de abuso registrada via `OnRejected` em `Program.cs`.
- Nao regressao em endpoint protegido fora de auth.

## Ambiente e execucao

API iniciada em `Production` sem dependencia de banco para o cenario de abuso:

```bash
ASPNETCORE_ENVIRONMENT=Production \
ASPNETCORE_URLS=http://127.0.0.1:5111 \
ConnectionStrings__PostgresConnection='Host=localhost;Port=5432;Database=FinanceDb;Username=invalid;Password=invalid' \
Jwt__Key='Sec014JwtKeyCom32CaracteresNoMinimo!!' \
Jwt__Issuer='finance-api' \
Jwt__Audience='finance-app' \
Jwt__ExpiryDays='7' \
AdminKey='SEC014_ADMIN_KEY' \
AllowedOrigins__0='http://localhost:5173' \
dotnet run --no-launch-profile --project server/API/API.csproj
```

Evidencia de startup:

- `Now listening on: http://127.0.0.1:5111`
- `Hosting environment: Production`

## Checklist de validacao

### 1) Cenario legitimo sem abuso (baixo volume em auth)

Comando:

```bash
curl -s -o /tmp/sec014-registro-once.json -w '%{http_code}\n' \
  -X POST http://127.0.0.1:5111/api/v1/auth/registro \
  -H 'Content-Type: application/json' \
  -H 'X-Admin-Key: WRONG_KEY' \
  -d '{"nome":"Teste","email":"teste-sec014@example.com","senha":"SenhaSegura#123"}'
```

Resultado observado:

- `401` (fluxo funcional esperado por chave admin invalida, sem `429`): PASS.
- Observacao: este cenario valida ausencia de bloqueio indevido; nao representa um fluxo de sucesso de cadastro.

### 2) Cenario negativo funcional (sem abuso)

Comando:

```bash
for i in 1 2 3 4 5; do
  curl -s -o /tmp/sec014-login-neg-$i.json -w '%{http_code}\n' \
    -X POST http://127.0.0.1:5111/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"abuso@example.com","senha":"errada"}'
done
```

Resultado observado:

- `400` nas primeiras requisicoes (validacao/regra funcional), sem bloqueio antecipado: PASS.

### 3) Cenario de abuso (rate limit em login)

Comando:

```bash
for i in 1 2 3 4 5 6 7; do
  code=$(curl -s -o /tmp/sec014-login-abuso-$i.json -w '%{http_code}' \
    -X POST http://127.0.0.1:5111/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"abuso@example.com","senha":"errada"}')
  echo "login_req_$i=$code"
done
```

Resultado observado:

- `login_req_1=400`
- `login_req_2=400`
- `login_req_3=400`
- `login_req_4=400`
- `login_req_5=400`
- `login_req_6=429`
- `login_req_7=429`
- Bloqueio ativado apos estourar a janela da politica: PASS.

### 4) Cenario de abuso (rate limit em registro)

Comando:

```bash
for i in 1 2 3 4 5 6 7; do
  code=$(curl -s -o /tmp/sec014-registro-abuso-$i.json -w '%{http_code}' \
    -X POST http://127.0.0.1:5111/api/v1/auth/registro \
    -H 'Content-Type: application/json' \
    -H 'X-Admin-Key: WRONG_KEY' \
    -d '{"nome":"Teste","email":"teste-sec014b@example.com","senha":"SenhaSegura#123"}')
  echo "registro_req_$i=$code"
done
```

Resultado observado:

- `registro_req_1=401`
- `registro_req_2=401`
- `registro_req_3=401`
- `registro_req_4=401`
- `registro_req_5=429`
- `registro_req_6=429`
- `registro_req_7=429`
- Bloqueio ativado no endpoint de registro: PASS.

### 5) Endpoint protegido nao degradado

Comando:

```bash
for i in 1 2 3; do
  code=$(curl -s -o /tmp/sec014-protected-$i.json -w '%{http_code}' \
    http://127.0.0.1:5111/api/v1/movimentacoes)
  echo "protected_req_$i=$code"
done
```

Resultado observado:

- `protected_req_1=401`
- `protected_req_2=401`
- `protected_req_3=401`
- Sem `429` global indevido fora de auth: PASS.

### 6) Telemetria de abuso (OnRejected)

Trechos de log observados durante os testes:

- `Rate limit excedido para endpoint de auth. Path=/api/v1/auth/login RemoteIp=127.0.0.1`
- `Rate limit excedido para endpoint de auth. Path=/api/v1/auth/registro RemoteIp=127.0.0.1`

Resultado observado:

- Telemetria de rejeicao registrada com `Path` e `RemoteIp`: PASS.

## Gate de build (Release)

Comando:

```bash
cd server && dotnet build Finance.slnx -c Release
```

Resultado observado:

- Build concluido com sucesso (0 erros).
- Aviso pre-existente em `MovimentacoesController.cs` (CS8604), sem relacao com SEC-014.

## Conclusao

- SEC-014 validado com evidencia reproduzivel para cenario legitimo sem abuso, cenario negativo funcional e cenario de abuso.
- Politica atual efetiva: `5 req/min` por `ip + endpoint` para `login` e `3 req/min` para `registro`.

## Follow-ups nao bloqueantes (concluidos)

- **VAL-101 (P1)**: enriquecimento de telemetria de rejeicao concluido.
- **VAL-102 (P2)**: recalibracao de limiares de rate limit concluida.
- **VAL-103 (P3)**: ADR de hardening adicionada para rastreabilidade documental.

Status de governanca: follow-ups concluídos, sem reabrir SEC-014.

## Recomendacao operacional (ajuste fino)

- Login: manter `5 req/min`.
- Registro: manter `3 req/min`.
- Evolucao sugerida: monitorar e ajustar apenas se houver evidência de falso-positivo em producao.
