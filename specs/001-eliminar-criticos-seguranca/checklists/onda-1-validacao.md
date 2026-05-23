# Checklist de Validacao - Onda 1 (SEC-001 e SEC-003)

Data de execucao: 2026-05-23
Status: CONCLUIDO (Onda 1)

## Escopo validado

- TASK-01: Segredos reais removidos de `server/API/appsettings.json`
- TASK-02: `server/API/appsettings.json` fora do versionamento + bootstrap seguro
- TASK-03: Senha hardcoded removida da migration de autenticacao
- TASK-04: Bootstrap manual seguro para admin inicial
- TASK-05: Comandos auditaveis executados

## Comandos auditaveis (plan §4)

1. Confirmar appsettings real fora do versionamento:

```bash
git -C server ls-files | grep -E '^API/appsettings\.json$'
```

Resultado esperado: sem saida.
Resultado obtido: PASS (sem saida).

2. Confirmar placeholders seguros no arquivo de exemplo:

```bash
grep -nE 'PostgresConnection|"Key"|AdminKey' server/API/appsettings.Example.json
```

Resultado esperado: apenas placeholders/exemplos sem segredo real.
Resultado obtido: PASS (somente placeholders).

3. Confirmar ausencia de senha hardcoded da auditoria:

```bash
grep -RIn 'Financas@2025!' server/Infrastructure/Migrations
```

Resultado esperado: sem saida.
Resultado obtido: PASS (sem saida).

4. Confirmar ausencia de hash com senha literal em migration:

```bash
grep -RInE 'HashPassword\("' server/Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs
```

Resultado esperado: sem saida.
Resultado obtido: PASS (sem saida).

5. Build de validacao:

```bash
dotnet build server/Finance.slnx
```

Resultado esperado: build concluido com sucesso.
Resultado obtido: PASS (build concluido com sucesso; 4 warnings pre-existentes fora do escopo SEC-001/SEC-003).

## Evidencias de implementacao

- `server/API/appsettings.json` com placeholders e sem segredo real no HEAD local.
- `server/.gitignore` com `API/appsettings.json` para impedir novo versionamento.
- `server/Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs` sem `Financas@2025!` e sem `HashPassword("...")`.
- `server/API/Controllers/AuthController.cs` com endpoint `POST /api/v1/auth/bootstrap-admin` protegido por `X-Bootstrap-Key`.
- `server/Core/UseCases/Auth/BootstrapAdminUseCase.cs` para bootstrap de admin sem seed de senha.
- `docs/runbooks/migrations-prod.md` com procedimento de bootstrap e rotacao imediata da senha temporaria.

## Revalidacao apos fechamento executavel da TASK-04

Data de reexecucao: 2026-05-23

- `CMD1` `git -C server ls-files | grep -E '^API/appsettings\.json$'`: PASS (sem saida).
- `CMD2` `grep -nE 'PostgresConnection|"Key"|AdminKey' server/API/appsettings.Example.json`: PASS (somente placeholders).
- `CMD3` `grep -RIn 'Financas@2025!' server/Infrastructure/Migrations`: PASS (sem saida).
- `CMD4` `grep -RInE 'HashPassword\("' server/Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs`: PASS (sem saida).
- `dotnet build server/Finance.slnx`: PASS (build concluido com 1 warning pre-existente fora do escopo de seguranca).

Fechamento executavel TASK-04:

- `POST /api/v1/auth/bootstrap-admin` agora retorna conflito quando ja existe usuario utilizavel.
- `POST /api/v1/auth/trocar-senha-temporaria` executa troca real e invalida a senha temporaria anterior via atualizacao de hash.
- Migration `20260422214104_AddAuth_UsuarioId.cs` removeu seed de credencial fixa reaproveitavel.
