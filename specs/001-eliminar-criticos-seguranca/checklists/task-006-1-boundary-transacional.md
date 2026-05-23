# TASK-006-1 - Boundary Transacional dos Fluxos Críticos de Investimento

Data: 2026-05-23
Status: CONCLUÍDO

## Lista fechada dos fluxos multi-escrita que exigem transação explícita

1. `RealizarAporteUseCase`
2. `RealizarSaqueUseCase`
3. `RemoverInvestimentoUseCase`

## Fluxos excluídos da lista

- `AtualizarSaldoInvestimentoUseCase` não é multi-escrita no estado atual: apenas atualiza `Investimento` e persiste uma única entidade.
- `CriarInvestimentoUseCase` não entrou neste boundary porque não foi apontado como fluxo crítico multi-escrita nesta tarefa.

## Boundary transacional proposto por fluxo

### 1) `RealizarAporteUseCase`

- Início: após carregar e validar o investimento, antes da primeira mutação persistida.
- Escopo da transação: `investimento.AdicionarAporte(...)`, `_investimentoRepository.Atualizar(investimento)`, `_movimentacaoRepository.Adicionar(saida)`.
- Commit: somente após as duas escritas concluírem com sucesso.
- Rollback: qualquer exceção entre a atualização do investimento e a inserção da movimentação.

### 2) `RealizarSaqueUseCase`

- Início: após carregar e validar o investimento, antes da primeira mutação persistida.
- Escopo da transação: `investimento.RegistrarSaque(...)`, `_investimentoRepository.Atualizar(investimento)`, `_movimentacaoRepository.Adicionar(entrada)`.
- Commit: somente após as duas escritas concluírem com sucesso.
- Rollback: qualquer exceção entre a atualização do investimento e a inserção da movimentação.

### 3) `RemoverInvestimentoUseCase`

- Início: após carregar e validar o investimento, antes de registrar estorno e remoção.
- Escopo da transação: criação do estorno quando `SaldoAtual > 0`, `_movimentacaoRepository.Adicionar(estorno)`, `_investimentoRepository.Remover(investimento)`.
- Commit: somente após a criação do estorno e a remoção concluírem com sucesso.
- Rollback: qualquer exceção após a criação do estorno e antes da remoção efetivar.
- Observação de branch: quando `SaldoAtual == 0`, o fluxo atual é single-write (apenas remoção), mas permanece no boundary por compartilhar o mesmo caso de uso crítico.

## Riscos de integridade atuais por fluxo

1. `RealizarAporteUseCase`

- Risco: investimento pode ser atualizado sem a movimentação correspondente se a segunda escrita falhar.
- Evidência atual: o use case chama dois repositórios distintos, cada um com `SaveChanges()` próprio.

2. `RealizarSaqueUseCase`

- Risco: saldo do investimento pode refletir o saque sem existir a movimentação de entrada/retirada correspondente.
- Evidência atual: duas persistências independentes com `SaveChanges()` em repositórios distintos.

3. `RemoverInvestimentoUseCase`

- Risco: estorno pode ser gravado e a remoção do investimento falhar, deixando saldo e entidade principal desencontrados.
- Risco adicional: uso de `DateTime.Now` gera inconsistência temporal e viola a regra de UTC para operações financeiras.

## Evidência rastreável para TASK-006-2

Comandos que sustentam a necessidade da atomicidade:

```bash
grep -RIn 'SaveChanges\(' server/Infrastructure/Repositories/Investimento/InvestimentoRepository.cs
grep -RIn 'SaveChanges\(' server/Infrastructure/Repositories/Movimentacao/MovimentacaoRepository.cs
grep -RIn 'DateTime.Now' server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs
```

Leitura direta dos fluxos afetados:

- [server/Core/UseCases/Investimento/RealizarAporteUseCase.cs](server/Core/UseCases/Investimento/RealizarAporteUseCase.cs)
- [server/Core/UseCases/Investimento/RealizarSaqueUseCase.cs](server/Core/UseCases/Investimento/RealizarSaqueUseCase.cs)
- [server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs](server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs)
- [server/Infrastructure/Repositories/Investimento/InvestimentoRepository.cs](server/Infrastructure/Repositories/Investimento/InvestimentoRepository.cs)
- [server/Infrastructure/Repositories/Movimentacao/MovimentacaoRepository.cs](server/Infrastructure/Repositories/Movimentacao/MovimentacaoRepository.cs)

## Constitution check

- Princípio IV - Data Integrity: **Conforme como boundary definido, não como implementação atual**.
- Nota: a implementação ainda precisa da TASK-006-2 para garantir commit/rollback único.
