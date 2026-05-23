# TASK-011 - Validacao de Endpoints Publicos de Auth

Data: 2026-05-23
Status: CONCLUIDO

## Escopo aplicado

- `server/API/Controllers/AuthController.cs`

## Evidencias (comandos)

```bash
grep -n "AllowAnonymous" server/API/Controllers/AuthController.cs
cd server && dotnet build Finance.slnx -c Release
```

## Resultado

- Endpoints de auth publicos com `[AllowAnonymous]` explicito: PASS.
- Endpoints fora do `AuthController` continuam no fluxo autenticado por heranca de `AuthenticatedController`: PASS.
- Build backend (`dotnet build server/Finance.slnx -c Release`): PASS.

## Constitution check

- Principio I (Bounded Architecture): CONFORME.
- Principio II (Security by Default): CONFORME.