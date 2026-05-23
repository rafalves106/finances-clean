# TASK-006-2 - Validacao de Atomicidade (Investimento)

Data: 2026-05-23
Status: CONCLUIDO

## Escopo validado

- `server/Core/UseCases/Investimento/RealizarAporteUseCase.cs`
- `server/Core/UseCases/Investimento/RealizarSaqueUseCase.cs`
- `server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs`
- `server/Core/Services/ITransactionManager.cs`
- `server/Infrastructure/Services/TransactionManager.cs`
- Registro DI em `server/API/Program.cs`

## Evidencias (comandos)

```bash
grep -RIn "ITransactionManager" \
  server/Core/UseCases/Investimento/RealizarAporteUseCase.cs \
  server/Core/UseCases/Investimento/RealizarSaqueUseCase.cs \
  server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs \
  server/API/Program.cs \
  server/Infrastructure/Services/TransactionManager.cs \
  server/Core/Services/ITransactionManager.cs

grep -RIn "DateTime.Now" server/Core/UseCases/Investimento

cd server && dotnet build Finance.slnx -c Release
```

## Resultado

- Uso de `ITransactionManager` presente nos 3 fluxos multi-escrita e no DI da API: PASS.
- Busca por `DateTime.Now` nos use cases de investimento sem ocorrencias: PASS.
- Build backend (`dotnet build server/Finance.slnx -c Release`): PASS.

## Observacoes

- Warnings de nulabilidade no build sao preexistentes e fora do escopo desta tarefa.