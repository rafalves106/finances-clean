# Tasks — Orcamento por Categoria com Alertas Visuais

**Input**: `specs/007-orcamento-por-categoria/spec.md`, `specs/007-orcamento-por-categoria/plan.md`

## Ordem de Execucao

1. Data (schema/migration)
2. Domain e contracts (entidades/DTOs/repositorios)
3. UseCases e API
4. UI (modal + dashboard)
5. Testes e validacao final

## TASK-01 — Evoluir schema para orcamento de categoria e override por usuario

**O que fazer:** adicionar `OrcamentoMensal` em `Categorias` e criar tabela de override por usuario para categorias globais com chave unica (`UsuarioId`, `CategoriaGlobalId`). (Ref: Plan §2, §3, ADR-1)
**Onde:** `server/Infrastructure/Data/FinanceDbContext.cs`, `server/Infrastructure/Migrations/*`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-02
**Reusar:** configuracoes EF Core existentes de `Categoria`
**Complexidade:** M
**Definition of Done:**

- [ ] Coluna `OrcamentoMensal` adicionada como opcional e precisa (`numeric/decimal`)
- [ ] Tabela de override criada com constraints e indice de unicidade
- [ ] Migration reversivel validada localmente
- [ ] Sem violacoes da constitution
- [ ] `dotnet build` passa

## TASK-02 — Atualizar modelo de dominio e DTOs de categoria

**O que fazer:** incluir orcamento opcional e validacoes em `Categoria`, criar entidade de override por usuario e evoluir `CategoriaDTO` para transportar o novo campo. (Ref: Plan §2, §4)
**Onde:** `server/Core/Domain/Categoria.cs`, `server/Core/Domain/CategoriaOrcamentoUsuario.cs`, `server/Core/Application/DTOs/Categoria/CategoriaDTO.cs`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-01
**Reusar:** validacoes atuais de `Categoria`
**Complexidade:** M
**Definition of Done:**

- [ ] Dominio suporta orcamento opcional com validacao de valor positivo
- [ ] Entidade de override por usuario criada com invariantes minimos
- [ ] DTO de categoria atualizado sem quebrar contratos existentes
- [ ] Sem violacoes da constitution
- [ ] `dotnet build` passa

## TASK-03 — Evoluir contratos e repositorios para leitura/escrita de orcamento efetivo

**O que fazer:** adicionar portas de persistencia para override e compor leitura de categoria com orcamento efetivo por usuario. (Ref: Plan §2, §3)
**Onde:** `server/Core/Repositories/ICategoriaRepository.cs`, `server/Core/Repositories/ICategoriaOrcamentoUsuarioRepository.cs`, `server/Infrastructure/Repositories/CategoriaRepository.cs`, `server/Infrastructure/Repositories/CategoriaOrcamentoUsuarioRepository.cs`
**Depende de:** TASK-01, TASK-02
**Pode ser paralela com:** TASK-04
**Reusar:** filtros de usuario e padrao de repositorio atual
**Complexidade:** M
**Definition of Done:**

- [ ] Repositorio grava orcamento em categoria do usuario
- [ ] Repositorio grava override para categoria global sem alterar row global
- [ ] Listagem retorna orcamento efetivo para usuario autenticado
- [ ] Sem violacoes da constitution
- [ ] `dotnet build` passa

## TASK-04 — Atualizar use cases de categoria para regra de override global

**O que fazer:** ajustar `CriarCategoriaUseCase`, `AtualizarCategoriaUseCase` e `ListarCategoriasUseCase` para persistir/retornar orcamento conforme regra de categoria do usuario vs categoria global. (Ref: Plan §3, §4, ADR-1)
**Onde:** `server/Core/UseCases/Categoria/CriarCategoriaUseCase.cs`, `server/Core/UseCases/Categoria/AtualizarCategoriaUseCase.cs`, `server/Core/UseCases/Categoria/ListarCategoriasUseCase.cs`
**Depende de:** TASK-03
**Pode ser paralela com:** TASK-05
**Reusar:** fluxo atual de CRUD de categorias
**Complexidade:** M
**Definition of Done:**

- [ ] Atualizacao de categoria global nao altera `Nome/Icone/Cor` global por usuario comum
- [ ] Orcamento em categoria global vira override por usuario
- [ ] Categoria sem orcamento continua suportada
- [ ] Sem violacoes da constitution
- [ ] `dotnet test` passa

## TASK-05 — Criar endpoint de alertas de orcamento por categoria no mes atual

**O que fazer:** implementar use case e endpoint para retornar consumo mensal, percentual, estado de alerta e total agregado para badge. (Ref: Plan §2, §3, §4, ADR-3)
**Onde:** `server/Core/UseCases/Categoria/ObterAlertasOrcamentoCategoriasUseCase.cs`, `server/API/Controllers/CategoriasController.cs`, DTOs de resposta em `server/Core/Application/DTOs/Categoria/*`
**Depende de:** TASK-03
**Pode ser paralela com:** TASK-04
**Reusar:** dados de movimentacoes por categoria ja existentes no dominio
**Complexidade:** M
**Definition of Done:**

- [ ] Endpoint autenticado retorna payload de alertas por categoria
- [ ] Cálculo considera apenas despesas do mes atual
- [ ] Badge total contabiliza somente categorias >=80%
- [ ] Contrato OpenAPI/Swagger atualizado para endpoint novo/alterado
- [ ] Sem violacoes da constitution
- [ ] `dotnet test` passa

## TASK-06 — Integrar orcamento no CategoryManagerModal

**O que fazer:** adicionar campo opcional de orcamento no modal de categorias, com validacao de entrada, suporte a limpar valor e payload compativel com API. (Ref: Plan §2, §3)
**Onde:** `client/src/components/CategoryManagerModal.jsx`
**Depende de:** TASK-04
**Pode ser paralela com:** TASK-07
**Reusar:** formulario e fluxo de salvar/editar categoria existentes
**Complexidade:** M
**Definition of Done:**

- [ ] Usuario consegue criar, editar e limpar orcamento no modal existente
- [ ] Validacao bloqueia valores invalidos (`<=0`)
- [ ] Categorias sem orcamento permanecem funcionais
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## TASK-07 — Integrar alertas e badge no DashboardView

**O que fazer:** consumir endpoint de alertas no dashboard e renderizar barra/progresso por categoria com cores por estado; ocultar badge quando zero alertas. (Ref: Plan §0, §3, ADR-2)
**Onde:** `client/src/components/DashboardView.jsx`, `client/src/services/api.js`
**Depende de:** TASK-05
**Pode ser paralela com:** TASK-06
**Reusar:** card de categorias e estruturas de tabs/estado ja existentes no dashboard
**Complexidade:** M
**Definition of Done:**

- [ ] Barras por categoria exibem estados normal/atencao/estourado corretamente
- [ ] Badge de alertas aparece apenas quando total > 0
- [ ] Sem orcamento nao gera alerta
- [ ] Sem dados nao quebra renderizacao
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## TASK-08 — Cobrir testes e validacao end-to-end da feature

**O que fazer:** adicionar testes backend/frontend para persistencia de orcamento, override global por usuario, calculo de alerta e regra de badge oculto com zero. (Ref: Plan §4, §6, §7)
**Onde:** `server/Tests/**`, `client/src/components/*.test.*`, `client/src/util/*.test.*`
**Depende de:** TASK-05, TASK-06, TASK-07
**Pode ser paralela com:** Nenhuma
**Reusar:** suites de testes de API e componentes ja existentes
**Complexidade:** L
**Definition of Done:**

- [ ] Testes cobrem orcamento de categoria do usuario
- [ ] Testes cobrem override em categoria global sem mutacao da base global
- [ ] Testes cobrem estados >=80% e >=100% e badge oculto em zero
- [ ] `dotnet test` verde no backend alterado
- [ ] `cd client && npm test` verde no frontend alterado
- [ ] Sem violacoes da constitution

## Gate Operacional Obrigatorio (ao final de cada task com codigo)

1. Executar `dotnet build` para alteracoes em `server/`.
2. Executar `dotnet test` para alteracoes de regras/API no backend.
3. Executar `cd client && npm run lint` para alteracoes em `client/`.
4. Executar `cd client && npm run build` para alteracoes em `client/`.
5. Executar `cd client && npm test` para alteracoes em `client/`.
6. Corrigir qualquer falha antes de seguir para a proxima task.
