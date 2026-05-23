# TASK-012 - Validacao de DTOs de Auth

Data: 2026-05-23
Status: EM VALIDACAO

## Escopo aplicado

- `server/Core/Application/DTOs/Auth/LoginDTO.cs`
- `server/Core/Application/DTOs/Auth/RegistroDTO.cs`

## Evidencias (comandos)

```bash
grep -RIn "Required\|EmailAddress\|MinLength\|MaxLength" \
  server/Core/Application/DTOs/Auth/LoginDTO.cs \
  server/Core/Application/DTOs/Auth/RegistroDTO.cs

cd server && dotnet build Finance.slnx -c Release

curl -i -sS -X POST http://127.0.0.1:5080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"invalido","senha":"123"}'

curl -i -sS -X POST http://127.0.0.1:5080/api/v1/auth/registro \
  -H 'Content-Type: application/json' \
  -d '{"nome":"A","email":"invalido","senha":"123"}'
```

## Resultado

- Ajuste aplicado: metadata de validacao em records alterada de `[property: ...]` para atributos no parametro do construtor primario.
- Build backend (`dotnet build server/Finance.slnx -c Release`): PASS.
- Validacao HTTP de fronteira: PENDENTE neste ambiente (API local sem `ConnectionStrings__DefaultConnection` configurada no processo de execucao isolada).
- Criterio de aceite permanece: payload invalido deve retornar 400 (nao 500).

## Constitution check

- Principio II (Security by Default): CONFORME.
- Principio III (Quality Gates): CONFORME.
