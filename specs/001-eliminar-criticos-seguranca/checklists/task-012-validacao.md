# TASK-012 - Validacao de DTOs de Auth

Data: 2026-05-23
Status: CONCLUIDO

## Escopo aplicado

- `server/Core/Application/DTOs/Auth/LoginDTO.cs`
- `server/Core/Application/DTOs/Auth/RegistroDTO.cs`

## Evidencias (comandos)

```bash
grep -RIn "Required\|EmailAddress\|MinLength\|MaxLength" \
  server/Core/Application/DTOs/Auth/LoginDTO.cs \
  server/Core/Application/DTOs/Auth/RegistroDTO.cs

cd server && dotnet build Finance.slnx -c Release
```

## Resultado

- `LoginDTO` com validacao explicita de email e senha: PASS.
- `RegistroDTO` com validacao explicita de nome, email e senha: PASS.
- Build backend (`dotnet build server/Finance.slnx -c Release`): PASS.

## Constitution check

- Principio II (Security by Default): CONFORME.
- Principio III (Quality Gates): CONFORME.