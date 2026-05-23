# TASK-006-3 - Validacao de Rollback Reproduzivel

Data: 2026-05-23
Status: CONCLUIDO

## Objetivo

Comprovar, com falha controlada e evidencia reproduzivel, que os fluxos criticos de investimento nao deixam estado parcial quando executados dentro do boundary transacional.

## Metodo da prova

- Ambiente isolado com Postgres temporario em `localhost:55433`.
- Harness C# temporario (`/tmp/task0063-proof`) executando dois cenarios no fluxo de remocao:
  1. **Sem transacao**: estorno persistido e falha antes da remocao.
  2. **Com transacao**: estorno e falha dentro de `TransactionManager.Execute(...)`.

## Comandos executados

```bash
docker run --name task0063-db \
  -e POSTGRES_USER=proof \
  -e POSTGRES_PASSWORD=proof \
  -e POSTGRES_DB=FinanceDb \
  -p 55433:5432 -d postgres:16-alpine

cd /tmp/task0063-proof
dotnet run -c Release | tee /tmp/task0063-proof/output.txt
```

## Resultado observado

Saida principal do harness:

```text
=== SCENARIO_A_NO_TRANSACTION (remocao) ===
FAILURE_TYPE=InvalidOperationException
MOV_ANTES=0
MOV_DEPOIS=1
INV_ANTES=1
INV_DEPOIS=1
PARTIAL_STATE=True

=== SCENARIO_B_WITH_TRANSACTION (remocao) ===
FAILURE_TYPE=InvalidOperationException
MOV_ANTES=0
MOV_DEPOIS=0
INV_ANTES=1
INV_DEPOIS=1
ROLLBACK_OK=True
```

## Conclusao

- **Sem transacao** houve estado parcial (movimentacao gravada, investimento nao removido): `PARTIAL_STATE=True`.
- **Com transacao explicita** o estado voltou ao ponto inicial apos falha controlada: `ROLLBACK_OK=True`.
- A evidencia confirma o criterio da TASK-006-3: rollback reproduzivel e sem persistencia parcial no boundary transacional.