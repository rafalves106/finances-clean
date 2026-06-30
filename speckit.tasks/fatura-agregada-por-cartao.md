### TASK-01 — Criar entidade `FaturaAgregada` e migration

**O que fazer:** Implementar a entidade `FaturaAgregada` no domínio e adicionar migration no DB. (Ver §2 Componentes do plano)
**Onde:** `server/Domain/FaturaAgregada` + migrations
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-02 (repositório) e TASK-03 (service)
**Reusar:** padrões de entidade e migrations existentes
**Definition of Done:**

- Migration criada e aplicável em dev/prod/staging
- Índice único (cartaoId,ciclo) presente
- Model coberto por unit tests de mapeamento

### TASK-02 — Adicionar referência `faturaAgregadaId` em `CompraCartao` e migrar dados

**O que fazer:** Adicionar campo opcional `faturaAgregadaId` em `CompraCartao`; criar script de migração para vincular compras/parcelas existentes por ciclo.
**Onde:** `server/Domain/CompraCartao` + migrations + script de migração
**Depende de:** TASK-01 (entidade criada)
**Pode ser paralela com:** TASK-05 (API)
**Reusar:** rotina de migração de parcelamento existente
**Definition of Done:**

- Campo adicionado e migrations aplicadas
- Script de migração incremental que associa compras/parcelas dos últimos 12 meses ao `FaturaAgregada` (parâmetro configurável)
- Testes de migração com dataset reduzido; plano de exceções documentado para >12 meses

### TASK-03 — Implementar `FaturaAgregadaService` (criar/atualizar/consulta)

**O que fazer:** Service para criar/atualizar `FaturaAgregada`, calcular total a partir de `CompraCartao` e expor API interna.
**Onde:** `server/Services/FaturaAgregadaService` (novo)
**Depende de:** TASK-01, TASK-02
**Pode ser paralela com:** TASK-04 (MovimentacaoService changes)
**Reusar:** patterns de services e repositórios existentes
**Definition of Done:**

- Funções internas: `getOrCreate(cartaoId,ciclo)`, `recalcularSync(cartaoId,ciclo,origem)` implementadas (síncrono, idempotente)
- Unit tests cobrindo cálculo de total incluindo parcelado e cenários de concorrência

### TASK-04 — Estender `MovimentacaoService` para `createOrUpdateForFatura`

**O que fazer:** Permitir criação/atualização idempotente de `Movimentacao` a partir de `FaturaAgregada` (usar faturaId como external id)
**Onde:** `server/Services/MovimentacaoService`
**Depende de:** TASK-03
**Pode ser paralela com:** TASK-06 (opcional)
**Definition of Done:**

- Função implementada e idempotente
- Integração testada com `FaturaAgregadaService` em testes de integração

### TASK-05 — Atualizar APIs de criação/edição/exclusão de `CompraCartao` para recálculo síncrono

**O que fazer:** Ao criar/editar/excluir compra do cartão, executar sincronamente `FaturaAgregadaService.recalcularSync(cartaoId,ciclo,origem)` e, em seguida, `MovimentacaoService.createOrUpdateForFatura`, garantindo idempotência e lock por (cartaoId,ciclo).
**Onde:** `server/Controllers/CompraCartaoController`
**Depende de:** TASK-02, TASK-03, TASK-04
**Pode ser paralela com:** TASK-07 (Observability)
**Definition of Done:**

- Recalculo síncrono executado em CRUD de compra do cartão
- Testes que verificam comportamento idempotente, ausência de duplicidade e latência aceitável

### TASK-06 — (Opcional) Implementar `RecalculoFaturaWorker` (evolução assíncrona)

**O que fazer:** Implementar consumer/event-bus para processar recalculos de forma assíncrona apenas se necessário por desempenho em produção. Não é obrigatório para fase 1.
**Onde:** `server/Workers/RecalculoFaturaWorker` (opcional)
**Depende de:** TASK-03, TASK-04
**Pode ser paralela com:** TASK-08 (migrations de parcelado)
**Definition of Done:**

- Worker documentado e implementado como melhoria não-blocking; testes E2E opcionais

### TASK-07 — Observabilidade: logs/metrics para recalculo

**O que fazer:** Adicionar log `fatura.recalculo` e métricas `fatura.recalculos.total`, etc.
**Onde:** pontos de recalculo no Service e Controller
**Depende de:** TASK-03
**Can be parallel with:** TASK-09 (QA tests)
**Definition of Done:**

- Logs gerados e métricas expostas no monitoring local

### TASK-08 — Mapear e migrar parcelamento existente para referência por fatura/ciclo

**O que fazer:** Mapear estrutura de parcelas existentes e adaptar ligação para `FaturaAgregada` (ou criar view que compute associação); criar script de migração incremental.
**Onde:** `server/Repositories/Parcelamento` + scripts
**Depende de:** TASK-02, TASK-03
**Definition of Done:**

- Parcelas dos últimos 12 meses associadas a `FaturaAgregada` em dataset de teste
- Testes cobrindo casos de parcelamento multi-ciclo dentro do período migrado
- Plano de exceções para parcelas >12 meses documentado

### TASK-09 — Testes de integração (fechamento/vencimento, edição/exclusão, parcelado, total zero)

**O que fazer:** Implementar bateria de testes de integração cobrindo checklist de fronteira (ver abaixo)
**Onde:** `Tests/Integration/FaturaAgregadaTests`
**Depende de:** TASK-01..TASK-08
**Definition of Done:**

- Testes passam no pipeline local
- Cobertura mínima dos casos de borda CA-01..CA-07

### TASK-10 — Documentação e changelog/post-deploy notes

**O que fazer:** Atualizar README de APIs e `docs/briefings` com notas de migração e impacto no fluxo de caixa; incluir runbook de rollback da migration.
**Onde:** `docs/` + `CHANGELOG.md`
**Depende de:** TASK-02, TASK-08
**Definition of Done:**

- Docs atualizados com instruções de verificação pós-deploy e rollback
