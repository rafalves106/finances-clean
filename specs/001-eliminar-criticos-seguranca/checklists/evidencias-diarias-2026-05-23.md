# Evidências Diárias - 2026-05-23

**Plano relacionado**: [plano-execucao-1-dia-backlog-pos-ciclo.md](plano-execucao-1-dia-backlog-pos-ciclo.md)
**Finalidade**: registrar as saídas auditáveis do dia para SEC-005, SEC-007 e SEC-008.

## Registro de Evidências

- **SEC-008**:
  - `grep -n "AdminKey=.*admin-key-local" docker-compose.yml` -> sem saída.
  - `ADMIN_KEY=placeholder docker compose config` -> composição resolvida com `AdminKey` explícito e sem fallback fraco `admin-key-local`.
- **SEC-005**:
  - `grep -RInE 'BadRequest\(ex\.Message\)|Unauthorized\(ex\.Message\)|NotFound\(ex\.Message\)|StatusCode\(500,.*ex\.Message\)' server/API/Controllers` -> sem saída.
  - `dotnet build server/Finance.slnx` -> sucesso.
- **SEC-007**:
  - `npm audit --omit=dev --json` -> `moderate=0`, `high=0`, `critical=0`.
  - `npm audit` -> 7 vulnerabilidades totais em dependências de desenvolvimento (2 moderate, 5 high), fora do gate de entrega shipping do dia.
  - `npm run build` -> sucesso.
  - `npm run lint` -> sucesso com 1 warning preexistente em `client/src/App.jsx` e exit code 0.
- **Fechamento**:
  - `git diff --stat` -> escopo contido em 10 arquivos alterados no workspace principal do dia.

## Status

- [x] SEC-008 validado
- [x] SEC-005 validado
- [x] SEC-007 validado
- [x] Fechamento consolidado

## Aceite Binário

- SEC-008: PASS
- SEC-005: PASS
- SEC-007: PASS
- Fechamento consolidado: PASS
