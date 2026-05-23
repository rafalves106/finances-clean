# TASK-009 - Validacao de TTL JWT

Data: 2026-05-23
Status: CONCLUIDO

## Escopo aplicado

- `server/Infrastructure/Services/TokenService.cs`
- `docker-compose.yml`
- `server/API/appsettings.Example.json`

## Evidencias (comandos)

```bash
sed -n '1,220p' server/Infrastructure/Services/TokenService.cs
grep -n "Jwt__Expiry" docker-compose.yml
grep -RIn "Jwt__ExpiryDays\|Jwt:ExpiryDays" server docker-compose.yml
cd server && dotnet build Finance.slnx -c Release
```

## Resultado

- Token passa a expirar com `AddMinutes(expiryMinutes)`: PASS.
- Fail-fast de configuracao de TTL fora da faixa `1..60`: PASS.
- Variavel de ambiente alterada para `Jwt__ExpiryMinutes` com default de 60: PASS.
- Referencias antigas em dias (`ExpiryDays`) removidas do backend/compose: PASS.
- Build backend em Release: PASS.

## Constitution check

- Principio II (Security by Default): CONFORME.
- Principio V (Operability segura): CONFORME, com falha explicita quando configuracao invalida.