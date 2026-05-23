# Checklist de Validacao - Onda 3 (SEC-004)

Data de execucao: 2026-05-23
Status: CONCLUIDO (sem pendencias operacionais)

## Escopo validado

- TASK-09: inventario e rotacao/revogacao de segredos comprometidos.
- TASK-10: backup/mirror + rollback testado.
- TASK-11: dry-run de rewrite com `git-filter-repo`.
- TASK-12: force push controlado do historico reescrito.
- TASK-13: re-clone e validacao operacional em servidor caseiro real.
- TASK-14: comandos auditaveis SEC-004 executados.

## Comandos auditaveis SEC-004 (plan §4)

Base de validacao: refs reescritas publicaveis (`refs/heads/*`) no mirror v2.

```bash
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S 'Yg#MLQ<}[#mjy30?ayS^eNPgCbug>G^7' -- API/appsettings.json --oneline
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S '#pUz]pA$[x0=MyxeNwCpy_qf>CTH^yF*' -- API/appsettings.json --oneline
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S 'Password=falvesadm' -- API/appsettings.json --oneline
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S 'Financas@2025!' -- Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs --oneline
```

Resultado obtido: PASS (sem saida em todos os comandos).

## Evidencia de publicacao

Comando:

```bash
GIT_TERMINAL_PROMPT=0 git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git push --mirror --force origin
```

Resultado obtido: PASS (force update de `main` e da branch da feature).

## Evidencia operacional da TASK-13 (ambiente real)

Execucao confirmada no servidor caseiro:

```bash
docker compose up -d --build
docker compose ps
curl -f http://localhost:5000/health
curl -f http://localhost:5000/ready
```

Resultado obtido: PASS.

Evidencias:

- backend em `Production`, container `backend` com status `healthy`
- `{"status":"healthy", ...}` em `/health`
- `{"status":"ready", ...}` em `/ready`

## Adendo pos-corte para repositorios limpos

Para eliminar rastros residuais de refs gerenciadas pelo provedor no repositorio legado,
foi executado corte para repositorios novos e privados:

- raiz: `https://github.com/rafalves106/finances-clean`
- backend: `https://github.com/rafalves106/finance-clean`

Validacao final executada em clones `--mirror` desses repositorios novos:

```bash
git log --all -S 'Yg#MLQ<}[#mjy30?ayS^eNPgCbug>G^7' --oneline
git log --all -S '#pUz]pA$[x0=MyxeNwCpy_qf>CTH^yF*' --oneline
git log --all -S 'Password=falvesadm' --oneline
git log --all -S 'Financas@2025!' --oneline
```

Resultado: PASS (sem ocorrencias).

Observacao final:

- TASK-13 encerrada no host caseiro real com validacao de saude e prontidao.
