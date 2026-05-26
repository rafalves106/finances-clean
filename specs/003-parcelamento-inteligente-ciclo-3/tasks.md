# Tasks — Parcelamento Inteligente com Numeracao Automatica (Ciclo 3)

**Input**: `specs/003-parcelamento-inteligente-ciclo-3/spec.md`, `specs/003-parcelamento-inteligente-ciclo-3/plan.md`

## Ordem de Execucao

1. Data (migration e persistencia)
2. Domain (enum e regra semantica)
3. Infra/Repository (consultas por grupo)
4. API (endpoint renumeracao)
5. UI (modal e listagem)
6. Testes e validacao final

## TASK-01 — Introduzir enum e propriedade de tipo fixo no dominio

**O que fazer:** adicionar `TipoMovimentacaoFixa` e incorporar no modelo `Movimentacao`, `Entrada` e `Saida` com default compativel. (Ref: Plan §2, §3, §8 ADR-1)
**Onde:** `server/Core/Domain/Movimentacao/*`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-02
**Reusar:** `TipoRecorrencia`, `Movimentacao` atual
**Complexidade:** S
**Definition of Done:**

- [ ] Enum `TipoMovimentacaoFixa` criado com `Parcelada` e `RecorrenteFixa`
- [ ] Entidades aceitam/persistem novo campo sem quebrar construtores existentes
- [ ] Sem violacoes da constitution
- [ ] Build passa e testes relevantes passam

## TASK-02 — Evoluir DTOs e contrato interno da movimentacao

**O que fazer:** incluir `TipoMovimentacaoFixa` no `MovimentacaoDTO` com default `RecorrenteFixa` para compatibilidade de payload antigo. (Ref: Plan §2, §3)
**Onde:** `server/Core/Application/DTOs/Movimentacao/MovimentacaoDTO.cs`
**Depende de:** TASK-01
**Pode ser paralela com:** TASK-03
**Reusar:** `MovimentacaoDTO` atual
**Complexidade:** S
**Definition of Done:**

- [ ] DTO exposto com novo campo e default seguro
- [ ] Contratos antigos continuam funcionais sem enviar o novo campo
- [ ] Sem violacoes da constitution
- [ ] Build passa e testes relevantes passam

## TASK-03 — Implementar numeracao automatica no CriarMovimentacaoUseCase

**O que fazer:** aplicar sufixo `{i+1}/{N}` somente para `Fixa=true` e `TipoMovimentacaoFixa=Parcelada`; manter recorrente fixa sem numeracao. (Ref: Plan §3, §4)
**Onde:** `server/Core/UseCases/Movimentacao/CriarMovimentacaoUseCase.cs`
**Depende de:** TASK-01, TASK-02
**Pode ser paralela com:** TASK-04
**Reusar:** fluxo atual de clonagem por periodo
**Complexidade:** M
**Definition of Done:**

- [ ] Parcelada gera `1/N..N/N` com consistencia de titulo
- [ ] Recorrente fixa nao altera titulo
- [ ] Validacao de periodo invalido coberta
- [ ] Sem violacoes da constitution
- [ ] Build passa e testes relevantes passam

## TASK-04 — Preparar migration de compatibilidade de dados

**O que fazer:** criar migration para nova coluna `TipoMovimentacaoFixa` com default `RecorrenteFixa` e rollback valido. (Ref: Plan §2, §4, §8 ADR-2)
**Onde:** `server/Infrastructure/Migrations/*`, `server/Infrastructure/Data/FinanceDbContext.cs`
**Depende de:** TASK-01
**Pode ser paralela com:** TASK-03
**Reusar:** padrao de migrations EF Core existente
**Complexidade:** M
**Definition of Done:**

- [ ] Migration criada com default seguro para linhas existentes
- [ ] `dotnet ef database update` executa sem erro em base local
- [ ] Rollback documentado/testado no ambiente local
- [ ] Sem violacoes da constitution
- [ ] Build passa e testes relevantes passam

## TASK-05 — Criar caso de uso de renumeracao retroativa por grupo

**O que fazer:** implementar `RenumerarGrupoUseCase` para normalizar titulo base e reaplicar sequencia `1/N..N/N` por grupo ordenado. (Ref: Plan §2, §3, §7, §8 ADR-3)
**Onde:** `server/Core/UseCases/Movimentacao/RenumerarGrupoUseCase.cs`, `server/Core/Repositories/IMovimentacaoRepository.cs`
**Depende de:** TASK-01
**Pode ser paralela com:** TASK-04
**Reusar:** `GrupoRecorrenciaId`, repositorio de movimentacao
**Complexidade:** M
**Definition of Done:**

- [ ] Caso de uso renumera grupo de forma deterministica
- [ ] Regex de normalizacao atua apenas em sufixo terminal
- [ ] Erro claro para grupo inexistente/nao autorizado
- [ ] Sem violacoes da constitution
- [ ] Build passa e testes relevantes passam

## TASK-06 — Implementar suporte de repositorio para renumeracao

**O que fazer:** adicionar metodos de consulta/atualizacao por grupo no repositório e persistir renumeracao em lote com escopo por usuario. (Ref: Plan §2, §3, §6)
**Onde:** `server/Infrastructure/Repositories/Movimentacao/MovimentacaoRepository.cs`
**Depende de:** TASK-05
**Pode ser paralela com:** Nenhuma
**Reusar:** filtros atuais de `FinanceDbContext` e includes necessarios
**Complexidade:** M
**Definition of Done:**

- [ ] Busca por `GrupoRecorrenciaId` retorna apenas dados do usuario autenticado
- [ ] Atualizacao em lote concluida sem perda de registros
- [ ] Sem violacoes da constitution
- [ ] Build passa e testes relevantes passam

## TASK-07 — Expor endpoint de renumeracao na API

**O que fazer:** adicionar endpoint autenticado no `MovimentacoesController` para acionar `RenumerarGrupoUseCase` e retornar resultado audivel. (Ref: Plan §2, §4)
**Onde:** `server/API/Controllers/Movimentacao/MovimentacoesController.cs`
**Depende de:** TASK-05, TASK-06
**Pode ser paralela com:** TASK-08
**Reusar:** padrao de responses do controller atual
**Complexidade:** S
**Definition of Done:**

- [ ] Endpoint criado com rota e contrato claros
- [ ] Tratamento de erros mapeado (400/404/403 conforme politica)
- [ ] Endpoint exige autenticacao
- [ ] Contrato OpenAPI/Swagger atualizado e validado para o novo endpoint
- [ ] Sem violacoes da constitution
- [ ] Build passa e testes relevantes passam

## TASK-08 — Atualizar TransactionModal para escolha explicita de tipo fixo

**O que fazer:** incluir toggle/radio `Parcelada | Recorrente Fixa` quando `Fixa=true`, enviando `tipoMovimentacaoFixa` no payload. (Ref: Plan §2, §3)
**Onde:** `client/src/components/TransactionModal.jsx`
**Depende de:** TASK-02
**Pode ser paralela com:** TASK-07
**Reusar:** estado `isFixed`, `period`, `tipoRecorrencia` ja existentes
**Complexidade:** M
**Definition of Done:**

- [ ] Controle visual aparece apenas quando aplicavel
- [ ] Payload enviado para API contem `tipoMovimentacaoFixa`
- [ ] Valor default preserva compatibilidade (`RecorrenteFixa`)
- [ ] Sem violacoes da constitution
- [ ] `npm run lint`, `npm run build`, `npm test` passam

## TASK-09 — Incluir acao de renumerar grupo existente no frontend

**O que fazer:** adicionar CTA em listagem de movimentacoes para renumerar grupo por `grupoRecorrenciaId`, com confirmacao e feedback de sucesso/erro. (Ref: Plan §2, §3, §7)
**Onde:** `client/src/components/DashboardView.jsx` (ou componente de listagem equivalente)
**Depende de:** TASK-07
**Pode ser paralela com:** Nenhuma
**Reusar:** fetch com `getAuthHeaders`, padrao de notificacao/toast existente
**Complexidade:** M
**Definition of Done:**

- [ ] Usuario consegue acionar renumeracao pela UI
- [ ] Requisicao usa endpoint novo e atualiza lista apos sucesso
- [ ] Mensagens de erro/sucesso claras
- [ ] Sem violacoes da constitution
- [ ] `npm run lint`, `npm run build`, `npm test` passam

## TASK-10 — Cobrir testes e validacao ponta a ponta

**O que fazer:** adicionar/atualizar testes automatizados e roteiro de validacao para: parcelada numerada, recorrente fixa sem sufixo, renumeracao retroativa, migration segura. (Ref: Plan §4, §6)
**Onde:** `server/*tests*` (ou projeto de testes existente), `client/src/components/*.test.*`, `specs/003-parcelamento-inteligente-ciclo-3/checklists/` (se necessario)
**Depende de:** TASK-03, TASK-04, TASK-07, TASK-08, TASK-09
**Pode ser paralela com:** Nenhuma
**Reusar:** suites de testes e padroes de validacao ja existentes
**Complexidade:** L
**Definition of Done:**

- [ ] Testes backend cobrem numeracao e renumeracao
- [ ] Testes frontend cobrem toggle e acao de renumerar
- [ ] Evidencia de migration aplicada sem regressao
- [ ] `dotnet test` verde no backend alterado
- [ ] `npm run lint`, `npm run build`, `npm test` verdes no frontend
- [ ] Sem violacoes da constitution

## Gate Operacional Obrigatorio (ao final de cada task com codigo)

1. Executar `dotnet build` no backend quando houver alteracao em `server/`.
2. Executar `dotnet test` no backend quando houver alteracao em regras/API.
3. Executar `cd client && npm run lint` quando houver alteracao em `client/`.
4. Executar `cd client && npm run build` quando houver alteracao em `client/`.
5. Executar `cd client && npm test` quando houver alteracao em `client/`.
6. Se qualquer comando falhar, corrigir antes de iniciar a proxima task.
