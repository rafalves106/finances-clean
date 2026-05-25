# Test Plan - Ciclo de Seguranca (001-eliminar-criticos-seguranca)

Data de referencia: 2026-05-25
Status: plano formal consolidado do ciclo executado

## 1. Objetivo

Documentar de forma formal e auditavel os testes minimos do ciclo de seguranca ja executado, cobrindo os fluxos criticos:

- Auth publica (`/api/v1/auth/login`, `/api/v1/auth/registro`)
- Rate limiting com `429` por endpoint de auth
- CORS (origem permitida vs origem bloqueada)
- Integridade financeira com transacoes atomicas

Este documento nao cria testes automatizados. Ele consolida o que deve ser executado e qual evidencia deve ser coletada.

## 2. Fontes de Verdade (implementacao e auditoria)

- Implementacao de auth e rate limit:
  - `server/API/Controllers/AuthController.cs`
  - `server/API/Program.cs`
- Evidencias de seguranca e fechamento:
  - `.specify/audits/security-2026-05-23.md`
  - `.specify/audits/security-2026-05-23-sec014.md`
- Evidencias operacionais de validacao:
  - `specs/001-eliminar-criticos-seguranca/checklists/onda-2-validacao.md`
  - `specs/001-eliminar-criticos-seguranca/checklists/task-014-validacao.md`
  - `specs/001-eliminar-criticos-seguranca/checklists/task-006-2-validacao.md`
  - `specs/001-eliminar-criticos-seguranca/checklists/task-006-3-validacao-rollback.md`

## 3. Ambiente Alvo de Execucao

- API local em `Production` para cenarios de seguranca de runtime.
- Banco temporario/isolado para prova de rollback financeiro (task-006-3).
- Evidencia obrigatoria anexada em checklist/auditoria correspondente do ciclo.

## 4. Matriz de Testes Minimos por Fluxo

## 4.1 Auth (login e registro)

| ID      | Cenario minimo                                                            | Tipo de teste                   | Evidencia esperada                                                                            | Comando de execucao alvo                                                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------ | -------------------------------------------------------- |
| AUTH-01 | Login com payload invalido (ex.: senha < 8) deve falhar na fronteira HTTP | Manual                          | HTTP `400` com validacao de DTO acionada pelo `[ApiController]`                               | `curl -s -o /tmp/auth-login-invalido.json -w '%{http_code}\n' -X POST http://127.0.0.1:5111/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"abuso@example.com","senha":"errada"}'`                                                                        |
| AUTH-02 | Registro com `X-Admin-Key` invalida deve ser negado                       | Manual                          | HTTP `401` com mensagem de chave invalida                                                     | `curl -s -o /tmp/auth-registro-adminkey-invalida.json -w '%{http_code}\n' -X POST http://127.0.0.1:5111/api/v1/auth/registro -H 'Content-Type: application/json' -H 'X-Admin-Key: WRONG_KEY' -d '{"nome":"Teste","email":"teste-sec@example.com","senha":"SenhaSegura#123"}'` |
| AUTH-03 | Endpoints publicos de auth devem manter escopo explicito de hardening     | Integracao (inspecao de wiring) | `[AllowAnonymous]` e `[EnableRateLimiting("AuthPublicPolicy")]` presentes em login e registro | `grep -nE "AllowAnonymous                                                                                                                                                                                                                                                     | EnableRateLimiting | HttpPost\(\"(login | registro)\"\)" server/API/Controllers/AuthController.cs` |

## 4.2 Rate Limiting (`429` por endpoint)

| ID    | Cenario minimo                                                         | Tipo de teste            | Evidencia esperada                                                                       | Comando de execucao alvo                                                                                                                                                                                                                                                                                                              |
| ----- | ---------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RL-01 | Burst em `POST /auth/login` deve retornar `429` apos exceder limite    | Manual                   | Sequencia observavel com `429` no mesmo endpoint (ex.: `...400,400,400,400,400,429,429`) | `for i in 1 2 3 4 5 6 7; do code=$(curl -s -o /tmp/rl-login-$i.json -w '%{http_code}' -X POST http://127.0.0.1:5111/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"abuso@example.com","senha":"errada"}'); echo "login_req_$i=$code"; done`                                                                      |
| RL-02 | Burst em `POST /auth/registro` deve retornar `429` no proprio endpoint | Manual                   | Sequencia observavel com `429` no endpoint de registro (limite mais restritivo)          | `for i in 1 2 3 4 5 6 7; do code=$(curl -s -o /tmp/rl-registro-$i.json -w '%{http_code}' -X POST http://127.0.0.1:5111/api/v1/auth/registro -H 'Content-Type: application/json' -H 'X-Admin-Key: WRONG_KEY' -d '{"nome":"Teste","email":"teste-sec014b@example.com","senha":"SenhaSegura#123"}'); echo "registro_req_$i=$code"; done` |
| RL-03 | Endpoint protegido fora de auth nao deve sofrer `429` indevido         | Manual                   | `GET /api/v1/movimentacoes` sem token retorna `401`, sem `429` global                    | `for i in 1 2 3; do code=$(curl -s -o /tmp/rl-protected-$i.json -w '%{http_code}' http://127.0.0.1:5111/api/v1/movimentacoes); echo "protected_req_$i=$code"; done`                                                                                                                                                                   |
| RL-04 | Rejeicao por limite deve gerar telemetria enriquecida                  | Integracao (runtime log) | Log com `TraceId`, `Method`, `Path`, `RemoteIp`, `UserAgent` no `OnRejected`             | `grep "Rate limit excedido para endpoint de auth" /tmp/sec014-api.log`                                                                                                                                                                                                                                                                |

## 4.3 CORS (origem permitida vs bloqueada)

| ID      | Cenario minimo                                                     | Tipo de teste                   | Evidencia esperada                                                   | Comando de execucao alvo                                                                                                                 |
| ------- | ------------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| CORS-01 | Origem nao permitida deve ficar sem `Access-Control-Allow-Origin`  | Manual                          | Resposta sem header CORS para origem bloqueada                       | `curl -i -X GET http://127.0.0.1:5099/health -H 'Origin: http://origem-nao-permitida.local'`                                             |
| CORS-02 | Origem permitida deve receber `Access-Control-Allow-Origin`        | Manual                          | Header `Access-Control-Allow-Origin` presente para origem autorizada | `curl -i -X OPTIONS http://127.0.0.1:5099/api/v1/auth/login -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST'` |
| CORS-03 | Wiring de CORS deve usar allowlist explicita, sem `AllowAnyOrigin` | Integracao (inspecao de wiring) | `WithOrigins(...)` presente e `AllowAnyOrigin` ausente               | `grep -RIn 'WithOrigins\|AllowAnyOrigin' server/API/Program.cs`                                                                          |

## 4.4 Integridade Financeira (transacoes atomicas)

| ID     | Cenario minimo                                                            | Tipo de teste                   | Evidencia esperada                                                                           | Comando de execucao alvo                                                                                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| FIN-01 | Fluxos de aporte/saque/remocao devem usar boundary transacional explicito | Integracao (inspecao de wiring) | `ITransactionManager` injetado e `_transactionManager.Execute(...)` presente nos 3 use cases | `grep -RIn "ITransactionManager\|_transactionManager.Execute" server/Core/UseCases/Investimento/RealizarAporteUseCase.cs server/Core/UseCases/Investimento/RealizarSaqueUseCase.cs server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs` |
| FIN-02 | Prova de falha controlada sem transacao deve mostrar estado parcial       | Integracao                      | Evidencia `PARTIAL_STATE=True` no harness de validacao                                       | `cd /tmp/task0063-proof && dotnet run -c Release                                                                                                                                                                                                    | tee /tmp/task0063-proof/output.txt`          |
| FIN-03 | Prova de falha controlada com transacao deve executar rollback total      | Integracao                      | Evidencia `ROLLBACK_OK=True` no harness de validacao                                         | `grep -E "PARTIAL_STATE                                                                                                                                                                                                                             | ROLLBACK_OK" /tmp/task0063-proof/output.txt` |
| FIN-04 | Datas em fluxo financeiro ajustado devem usar UTC                         | Integracao (inspecao de wiring) | `DateTime.Now` ausente em use cases de investimento revisados                                | `grep -RIn "DateTime.Now\|DateTime.UtcNow" server/Core/UseCases/Investimento`                                                                                                                                                                       |

## 5. Criterios de Aprovacao do Plano

Este plano e considerado executado com sucesso quando:

1. Todos os cenarios minimos acima possuem evidencia anexada no artefato de validacao do ciclo.
2. Rate limiting retorna `429` por endpoint de auth sem degradar endpoint protegido fora de auth.
3. CORS comprova diferenca objetiva entre origem permitida e bloqueada via headers.
4. Integridade financeira comprova rollback reproduzivel sob falha controlada.

## 6. Rastreabilidade de Evidencias

- Auth + rate limiting: `specs/001-eliminar-criticos-seguranca/checklists/task-014-validacao.md` e `.specify/audits/security-2026-05-23-sec014.md`
- CORS: `specs/001-eliminar-criticos-seguranca/checklists/onda-2-validacao.md`
- Integridade financeira: `specs/001-eliminar-criticos-seguranca/checklists/task-006-2-validacao.md` e `specs/001-eliminar-criticos-seguranca/checklists/task-006-3-validacao-rollback.md`
