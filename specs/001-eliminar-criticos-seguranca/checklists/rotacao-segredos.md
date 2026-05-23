# Checklist de Rotacao/Revogacao de Segredos (TASK-09)

Data de execucao: 2026-05-23
Status: CONCLUIDO (sem pendencias operacionais)

## Inventario de segredos comprometidos (SEC-004)

1. `Jwt.Key` historico: `<REDACTED_JWT_KEY_OLD>`
2. `AdminKey` historico: `<REDACTED_ADMIN_KEY_OLD>`
3. `PostgresConnection` historico: `Password=<REDACTED_DB_PASSWORD_OLD>`
4. Senha hardcoded de seed: `<REDACTED_SEED_PASSWORD_OLD>`

## Evidencias de baseline (antes da contencao)

Comandos executados no repositorio `server`:

```bash
git -C server log --all -S '<REDACTED_JWT_KEY_OLD>' -- API/appsettings.json --oneline
git -C server log --all -S '<REDACTED_ADMIN_KEY_OLD>' -- API/appsettings.json --oneline
git -C server log --all -S 'Password=<REDACTED_DB_PASSWORD_OLD>' -- API/appsettings.json --oneline
git -C server log --all -S '<REDACTED_SEED_PASSWORD_OLD>' -- Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs --oneline
```

Resultado obtido: PASS (segredos historicos identificados para tratamento).

## Rotacao/revogacao executada no ciclo

1. `Jwt.Key` e `AdminKey`

- Acao: geradas novas chaves de runtime e validado startup da API em `Production`.
- Evidencia: `ROTATION_STARTUP_OK=1`, health `{"status":"healthy", ...}`.
- Evidencia mascarada (hashes SHA-256):
  - `JWT_SHA256=80b00bec9652807b0d95a1b826496561bb821d1d3612ae2efe3408e5d183ad8f`
  - `ADMIN_SHA256=887dedc1ebb39503e798c74a16607154ed25e836be8d6f3fe420a69536663464`

2. `Password=<REDACTED_DB_PASSWORD_OLD>` (connection string historica)

- Acao: limpeza de historico via `git-filter-repo` e force push controlado.
- Evidencia: comandos SEC-004 em refs reescritas sem ocorrencia (ver `onda-3-validacao.md`).

3. `<REDACTED_SEED_PASSWORD_OLD>`

- Acao: removida do HEAD (Onda 1) e removida do historico reescrito.
- Evidencia: comandos SEC-003/SEC-004 sem ocorrencia.

## Observacao operacional

- Validacao operacional concluida no host caseiro com API em `Production` e endpoints `/health` e `/ready` respondendo com sucesso.
- Pendencia de ambiente removida para o fechamento do ciclo 1.
