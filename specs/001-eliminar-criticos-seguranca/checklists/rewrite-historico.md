# Checklist de Rewrite de Historico (TASK-10 a TASK-12)

Data de execucao: 2026-05-23
Workspace operacional: `/tmp/sec004-20260523-150807`
Status: CONCLUIDO (com corte final para repositorios limpos)

## TASK-10 - Backup/mirror antes do rewrite

Comandos executados:

```bash
git clone --mirror server /tmp/sec004-20260523-150807/server-backup-mirror.git
git --git-dir=/tmp/sec004-20260523-150807/server-backup-mirror.git fsck --full
```

Resultado obtido: PASS.

## TASK-10 - Teste de rollback executavel

Comandos executados:

```bash
git clone /tmp/sec004-20260523-150807/server-backup-mirror.git /tmp/sec004-20260523-150807/server-rollback-test
dotnet build /tmp/sec004-20260523-150807/server-rollback-test/Finance.slnx -m:1
```

Resultado obtido: PASS (build de rollback concluido).

## TASK-11 - Dry-run de limpeza com git-filter-repo

Regras utilizadas (replace-text):

- JWT comprometido
- AdminKey comprometida
- Connection string com `Password=<REDACTED_DB_PASSWORD_OLD>`
- Senha hardcoded `<REDACTED_SEED_PASSWORD_OLD>`

Comando de dry-run em mirror:

```bash
/Users/falves/Library/Python/3.9/bin/git-filter-repo \
  --force \
  --replace-text /tmp/sec004-20260523-150807/replacements-v2.txt \
  --target /tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git
```

Validacao local das refs publicaveis reescritas:

```bash
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S '<REDACTED_JWT_KEY_OLD>' -- API/appsettings.json --oneline
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S '<REDACTED_ADMIN_KEY_OLD>' -- API/appsettings.json --oneline
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S 'Password=<REDACTED_DB_PASSWORD_OLD>' -- API/appsettings.json --oneline
git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git log --all -S '<REDACTED_SEED_PASSWORD_OLD>' -- Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs --oneline
```

Resultado obtido: PASS (sem saida).

## TASK-12 - Force push controlado

Preflight:

```bash
GIT_TERMINAL_PROMPT=0 git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror.git push --mirror --force --dry-run origin
```

Execucao final (passo efetivo):

```bash
GIT_TERMINAL_PROMPT=0 git --git-dir=/tmp/sec004-20260523-150807/server-rewrite-mirror-v2.git push --mirror --force origin
```

Resultado obtido: PASS.

Resumo de atualizacao publicado:

- `main`: `d12e709` -> `cd79055` (forced update)
- `001-eliminar-criticos-seguranca`: `015e956` -> `b95e0fe` (forced update)

## Verificacao pos-publicacao

Clone de verificacao:

```bash
git clone --mirror https://github.com/rafalves106/finance.git /tmp/sec004-20260523-150807/server-remote-verify-mirror-v2.git
```

Diagnostico de refs:

```bash
git --git-dir=/tmp/sec004-20260523-150807/server-remote-verify-mirror-v2.git for-each-ref --contains dba3380cb1aafd1d7622564afd6fa0be99a1f569 --format='%(refname)'
```

Resultado: `refs/pull/1/head` (ref gerenciada pelo GitHub, fora do escopo de push por branch).

Observacao inicial:

- As refs publicadas de branch (`refs/heads/*`) ficaram limpas no rewrite v2.
- Foi detectada ref externa do provedor em repositorio legado, fora de controle por `push` comum.

## Adendo - Corte final para limpeza total de rastro

Para eliminar completamente rastros em refs externas do provedor, foi executado corte para
repositorios novos privados:

1. criado `rafalves106/finance-clean` e publicado historico saneado
2. criado `rafalves106/finances-clean` e publicado historico saneado
3. removidas refs auxiliares `refs/remotes/*` que foram espelhadas por engano
4. revalidado `git log --all -S` sem hits para os 4 segredos criticos
5. arquivados repositorios antigos (`Finances` e `finance`)

Estado final de refs publicadas nos repositorios limpos:

- `refs/heads/main`
- `refs/heads/001-eliminar-criticos-seguranca`

Sem refs de PR legadas no escopo dos repositorios novos criados para o corte.
