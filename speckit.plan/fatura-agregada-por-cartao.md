## §0 Contexto de Negócio

- Persona: PO e usuário final que precisa de leitura correta do caixa sem duplicidade.
- Dor: compras no cartão geram percepção de duplicidade no caixa.
- Valor: uma única movimentação por cartão/ciclo, com rastreabilidade das compras.
- KPIs: CA-01..CA-07 (ver spec)

## §1 Arquitetura

```mermaid
flowchart LR
  Compras["ComprasCartao / Parcelas"] -->|associa| Fatura[FaturaAgregada]
  Fatura -->|gera| Mov[Movimentacao (data=vencimento)]
  Compras -->|não gera| Mov
  SistemaAPI --> Compras
  SistemaAPI --> Fatura
  Mov --> Caixa[Caixa/Fluxo]
```

Componentes (fase 1 - pragmática):

- `ComprasCartao` (módulo existente): registra compras e parcelas; passará a referenciar `FaturaAgregada`.
- `FaturaAgregada` (novo service + persist): garante unicidade por (cartao,ciclo), calcula total e expõe movimentacaoId.
- `Movimentacao` (módulo existente): cria/atualiza movimentacao com data = vencimento da `FaturaAgregada`.
- Recalculo síncrono integrado: nas operações CRUD de `CompraCartao`, o controller/serviço chama `FaturaAgregadaService.recalcular` e em seguida `MovimentacaoService.createOrUpdateForFatura` de forma idempotente.

Nota: Arquitetura assíncrona (Event Bus + Worker) é mantida como evolução opcional para fases posteriores, não exigida na fase 1.

Latência crítica: recálculo deve ser percebido imediatamente pela API; portanto, a fase 1 adotará recálculo síncrono e idempotente dentro do fluxo de CRUD (CA-02). A opção assíncrona fica para evolução.

## §2 Componentes (arquivo · estado atual · mudança · responsabilidade · impacto de negócio)

- `server/Domain/Cartao` · existente · adicionar `vencimentoDia` verificação · responsabilidade: determinar vencimento · impacto: necessário para data de efetivação da movimentação.
- `server/Domain/CompraCartao` · existente · adicionar `faturaAgregadaId` opcional e referência a parcela/ciclo · responsabilidade: associar compras/parcelas ao ciclo · impacto: rastreabilidade, evita duplicidade.
- `server/Domain/FaturaAgregada` · novo arquivo/entidade · criar persistência e service · responsabilidade: agregar valores por (cartao,ciclo) e criar/atualizar `Movimentacao` · impacto: principal mecanismo de não duplicação.
- `server/Services/MovimentacaoService` · existente · estender para aceitar criação/atualização a partir de `FaturaAgregada` (idempotente) · responsabilidade: garantir 1 movimentacao por fatura · impacto: atualiza caixa na data de vencimento.
- Nota: `RecalculoFaturaWorker`/event-bus não é parte do escopo de fase 1; será planejado como melhoria não-blocking.

## §3 Fluxo de Dados (caminho feliz)

1. Usuário cria `CompraCartao` (ou parcela existente é atribuída) através da API.
2. `CompraCartaoService` persiste compra.
3. Na mesma requisição, `CompraCartaoController` chama `FaturaAgregadaService.recalcular(cartaoId,ciclo,origem)` de forma síncrona (com lock por cartaoId+ciclo).
4. `FaturaAgregadaService` atualiza `valorTotal` e chama `MovimentacaoService.createOrUpdateForFatura(faturaId)` de forma idempotente.
5. `MovimentacaoService` cria/atualiza uma `Movimentacao` com `data = fatura.vencimento`, `valor = fatura.valorTotal` (pode ser 0) e persiste idempotentemente.
6. Na leitura do fluxo de caixa, apenas `Movimentacao` com data<=hoje e tipo=`saida` impacta saldo; compras individuais do cartão não são contabilizadas como saídas duplicadas.

## §4 Validação e Erros

- Verificações:
  - Unicidade: ao criar `FaturaAgregada`, garantir index único (cartaoId,ciclo).
  - Idempotência: `MovimentacaoService.createOrUpdateForFatura` deve ser idempotente (usar faturaId como externalId).
  - Recalculo atomicidade: recalculo por (cartaoId,ciclo) deve usar lock otimista/pessimista para evitar corrida de atualização.
  - Sem juros/pagamento parcial: validar que nenhuma transformação cria campos de juros ou parcelas de pagamento.
- Códigos de erro:
  - 409: conflito de ciclo/vencimento duplicado
  - 422: tentativa de criar pagamento parcial / juros (rejeitar)
  - 500: erro de processamento (log + retry)

## §5 Integrações Externas

- Reusar APIs existentes de `Movimentacao` e `Compras`.
- Event bus interno (Rabbit/Kafka/DomainEvents) opcional para evolução futura; não é necessário para a fase 1. Pode ser implementado com pub/sub local se infra for simples.

## §6 Constitution Check

- Princípio: Dependências apontam pra dentro — mantido (novo `FaturaAgregada` é domínio interno).
- Princípio: Testabilidade — serviços com injeção de repositório.
- Se violar algo, justificar e criar task de mitigação.

## §7 Trade-offs e Riscos

- Fase 1: recálculo síncrono e idempotente na trilha de CRUD. Justificativa: menor superfície de risco, implementação direta, leitura imediata e baixo custo de migração.
- Evolução futura: arquitetura baseada em eventos (event bus + worker) é uma opção para quando houver necessidade de desacoplamento por desempenho; não é parte da fase 1.

- Risco: corrida em múltiplas atualizações simultâneas — mitigação: locks por (cartao,ciclo) + retries.

- ADR-01: Nova entidade `FaturaAgregada` persistida em DB relacional com constraint único (cartaoId,ciclo). Justificativa: garante invariantes de unicidade e simplifica queries de consolidação.
- ADR-02: Arquitetura assíncrona (event-bus + worker) — opção de evolução futura, não implementada na fase 1.
