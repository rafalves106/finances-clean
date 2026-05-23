# Plano de Execução de 1 Dia - Backlog Pós-Ciclo

**Data**: 2026-05-23
**Base**: [tasks.md](../tasks.md), [.specify/audits/security-2026-05-19.md](../../../.specify/audits/security-2026-05-19.md), [.specify/memory/constitution.md](../../../.specify/memory/constitution.md)
**Objetivo de negócio**: reduzir o risco explorável mais rápido possível, fechando hoje os itens com maior impacto imediato na exposição do usuário e do runtime, sem abrir refatoração ampla antes da hora.
**Escopo do dia**: fechar SEC-008 e SEC-007 hoje, entregar versão mínima segura de SEC-005 hoje, e deixar SEC-006 e SEC-009..013 quebrados em tarefas executáveis para amanhã.

## §0 Contexto de Negócio

- **Persona**: Rafael, único mantenedor, operador e usuário do produto.
- **Dor real**: o app ainda expõe risco desnecessário por fallback fraco de credencial, vazamento de detalhes de erro e dependências frontend vulneráveis.
- **Valor entregue hoje**: reduzir a chance de acesso indevido, exposição de informação sensível e exploração via cadeia de dependências, antes de investir em endurecimento estrutural maior.
- **KPIs afetados**:
  - zero fallback fraco de `ADMIN_KEY` em qualquer ambiente.
  - zero respostas HTTP expondo `ex.Message` ao cliente.
  - zero vulnerabilidades `high` ou `moderate` no escopo de entrega de 1 dia (dependências de produção/frontend shipping).
- **Restrição operacional**: 1 pessoa, 1 dia, validação precisa ser curta, repetível e auditável.

## §1 Prioridade Executiva

1. **SEC-008 hoje primeiro**: o fallback de `ADMIN_KEY` é risco direto de autenticação fraca e tem remoção simples com alta redução de risco.
2. **SEC-005 em versão mínima segura hoje**: vazamento de mensagem interna em resposta HTTP amplia superfície de informação e pode auxiliar abuso; a correção deve ser ampla o suficiente para eliminar o leak, mas sem redesenhar o tratamento global de erros.
3. **SEC-007 hoje**: dependências npm vulneráveis são risco de cadeia de suprimentos e precisam ser fechadas no mesmo dia com validação de build/lint/audit.
4. **SEC-006 e SEC-009..013 amanhã**: são importantes, mas exigem desenho e validação mais cuidadosos; o foco de hoje é sair do estado mais exposto.

## §2 Plano por Blocos de Tempo

| Bloco | Janela sugerida | Foco                                                                                                     | Saída binária esperada                                                                                                                           | Evidência auditável                                                                                                                                                                     |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 09:00-10:00     | **SEC-008** - remover fallback fraco de `ADMIN_KEY` no compose para todos os ambientes                   | `docker-compose.yml` não contém fallback inseguro; startup falha explicitamente se `ADMIN_KEY` não estiver definido fora de ambiente local       | `grep -n "AdminKey=.*admin-key-local" docker-compose.yml` sem resultado; `docker compose config` mostrando ausência de default fraco; registro do comportamento de fail fast em startup |
| 2     | 10:00-11:45     | **SEC-005** - substituir exposição de `ex.Message` por resposta genérica segura nos controllers afetados | Nenhuma resposta HTTP pública devolve mensagem interna; detalhes ficam restritos ao servidor ou ao log interno                                   | ver Comandos Oficiais Copiar/Colar em §4                                                                                                                                                |
| 3     | 13:00-14:30     | **SEC-007** - atualizar dependências npm vulneráveis com mudança mínima e segura                         | `npm audit --omit=dev` não reporta vulnerabilidades `high`/`moderate` no escopo de entrega de 1 dia (dependências de produção/frontend shipping) | `npm audit --omit=dev` como gate obrigatório; `npm audit` completo apenas informativo; `npm run build`; `npm run lint`; diff de `client/package.json` e `client/package-lock.json`      |
| 4     | 14:30-16:00     | **Consolidação** - validar regressão e fechar evidências do dia                                          | Pacote de evidências completo, sem quebra de build e sem retorno de risco conhecido nos itens tratados                                           | checklist diário com links para saídas dos comandos, `git diff --stat`, e nota de status de fechamento                                                                                  |

## §3 Critérios Binários de Aceite por Tarefa de Hoje

### TASK-H1 - Fechar SEC-008

**O que fazer:** remover o fallback fraco de `ADMIN_KEY` no compose e manter apenas configuração explícita por ambiente.

**Onde:** `docker-compose.yml`

**Definition of Done:**

- [ ] Não existe fallback fraco para `ADMIN_KEY` em `docker-compose.yml`.
- [ ] Em ambiente não local, a ausência de `ADMIN_KEY` gera falha explícita de configuração, sem fallback inseguro.
- [ ] O comportamento final está comprovado por saída de comando auditável.
- [ ] Sem violação da Constitution, especialmente Princípio II.

**Evidência esperada:** saída de `grep` vazia para o fallback inseguro, `docker compose config` validado e captura do startup fail fast.

### TASK-H2 - Entregar SEC-005 em versão mínima segura

**O que fazer:** eliminar o leak de `ex.Message` nas respostas HTTP públicas, preservando apenas mensagens genéricas seguras para o cliente.

**Onde:** `server/API/Controllers/**`

**Definition of Done:**

- [ ] Nenhum endpoint público retorna `ex.Message` em body HTTP.
- [ ] O status HTTP permanece coerente com a falha, mas o conteúdo exposto ao cliente é genérico.
- [ ] O escopo mínimo necessário foi aplicado sem refatorar fluxo além do indispensável.
- [ ] Build backend passa após a alteração.
- [ ] Sem violação da Constitution, especialmente Princípios II e V.

**Evidência esperada:** busca textual sem ocorrências de `BadRequest(ex.Message)`, `Unauthorized(ex.Message)`, `NotFound(ex.Message)` e `StatusCode(500,.*ex.Message)` nos controllers afetados; `dotnet build server/Finance.slnx` verde.

### TASK-H3 - Fechar SEC-007 hoje

**O que fazer:** atualizar dependências npm vulneráveis com o menor conjunto de mudanças possível, preservando o comportamento do frontend.

**Onde:** `client/package.json`, `client/package-lock.json`

**Definition of Done:**

- [ ] `npm audit --omit=dev` não reporta vulnerabilidades `high` ou `moderate` no escopo de entrega de 1 dia (dependências de produção/frontend shipping).
- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.
- [ ] O diff de dependências é o menor necessário para fechar o risco identificado no mesmo escopo de entrega.
- [ ] Sem violação da Constitution, especialmente Princípio III.

**Evidência esperada:** saída de `npm audit --omit=dev` como gate obrigatório; `npm audit` completo apenas informativo, além de build e lint verdes e diff consolidado dos arquivos `package*.json`.

## §4 Pacote de Evidências Auditáveis do Dia

As evidências abaixo devem ser anexadas ao arquivo [evidencias-diarias-2026-05-23.md](evidencias-diarias-2026-05-23.md) no encerramento do bloco 4:

### Comandos Oficiais Copiar/Colar

```bash
grep -RInE 'BadRequest\(ex\.Message\)|Unauthorized\(ex\.Message\)|NotFound\(ex\.Message\)|StatusCode\(500,.*ex\.Message\)' server/API/Controllers
dotnet build server/Finance.slnx
```

| Evidência               | Comando/artefato                                          | O que comprova                                                                      |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Evidência SEC-008       | `grep -n "AdminKey=.*admin-key-local" docker-compose.yml` | ausência do fallback fraco no compose                                               |
| Evidência SEC-008       | `docker compose config`                                   | resolução final da configuração sem default inseguro                                |
| Evidência SEC-007       | `npm audit --omit=dev`                                    | redução ou eliminação das vulnerabilidades reportadas no escopo de entrega de 1 dia |
| Evidência SEC-007       | `npm audit`                                               | checagem informativa adicional do inventário completo de dependências               |
| Evidência SEC-007       | `npm run build`                                           | frontend permanece compilando                                                       |
| Evidência SEC-007       | `npm run lint`                                            | nenhum erro novo de lint foi introduzido                                            |
| Evidência de fechamento | `git diff --stat`                                         | escopo final da mudança permanece contido                                           |

## §5 Tarefas Que Devem Ficar Prontas Para Amanhã

### SEC-006 - Transações explícitas em operações financeiras multi-escrita

#### TASK-006-1 - Definir boundary transacional mínimo

**O que fazer:** separar claramente quais operações precisam de atomicidade e qual contrato interno vai garantir commit/rollback único.

**Onde:** `server/Core/UseCases/Investimento/**`, `server/Core/Repositories/**`, `server/Infrastructure/Repositories/**`

**Definition of Done:**

- [ ] Existe lista fechada dos fluxos multi-escrita que exigem transação.
- [ ] O ponto de controle da transação está definido antes de implementar a mutação.
- [ ] Não há mudança de comportamento funcional ainda, apenas desenho rastreável.
- [ ] Constitution check para Princípio IV está explicitamente registrada.

**Evidência esperada:** nota técnica curta com o boundary aprovado e referência aos use cases afetados.

#### TASK-006-2 - Implementar atomicidade nos fluxos críticos

**O que fazer:** aplicar transação explícita nos fluxos de aporte, saque e remoção de investimento para evitar estado parcial.

**Onde:** `server/Core/UseCases/Investimento/RealizarAporteUseCase.cs`, `server/Core/UseCases/Investimento/RealizarSaqueUseCase.cs`, `server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs`

**Definition of Done:**

- [ ] Cada fluxo multi-escrita termina em commit único ou rollback total.
- [ ] Falha na segunda escrita não deixa estado parcialmente persistido.
- [ ] O uso de `DateTime.Now` é removido do fluxo financeiro atingido por esta tarefa.
- [ ] Build backend passa após a mudança.
- [ ] Constitution check registra conformidade com o Princípio IV.

**Evidência esperada:** validação de falha controlada mostrando ausência de gravação parcial, build verde e busca textual sem `DateTime.Now` no fluxo alterado.

#### TASK-006-3 - Validar atomicidade com evidência reproduzível

**O que fazer:** executar prova de falha controlada e documentar que não há persistência parcial em caso de erro.

**Onde:** `specs/001-eliminar-criticos-seguranca/checklists/`

**Definition of Done:**

- [ ] Existe evidência reproduzível de rollback em caso de falha.
- [ ] A validação mostra estado final consistente antes e depois do erro simulado.
- [ ] A evidência pode ser refeita sem interpretação subjetiva.

**Evidência esperada:** saída de comando ou teste que provoque falha e confirme ausência de escrita parcial.

### SEC-009 - JWT TTL excessivo

#### TASK-009 - Reduzir TTL do JWT para janela segura

**O que fazer:** reduzir o tempo de vida do token para uma janela compatível com contexto financeiro e documentar o valor final escolhido.

**Onde:** `server/Infrastructure/Services/TokenService.cs`, `server/API/Program.cs` ou configuração equivalente

**Definition of Done:**

- [ ] O TTL final fica em no máximo 1h, ou o plano inclui justificativa explícita de exceção aprovada.
- [ ] O backend continua validando issuer, audience e lifetime normalmente.
- [ ] Build backend passa.
- [ ] Constitution check registra conformidade com os Princípios II e V.

**Evidência esperada:** diff da configuração, build verde e validação de token expiração.

### SEC-010 - Headers HTTP de hardening ausentes

#### TASK-010 - Adicionar cabeçalhos de segurança na API

**O que fazer:** ativar headers de hardening compatíveis com o stack atual, sem quebrar o frontend.

**Onde:** `server/API/Program.cs`

**Definition of Done:**

- [ ] `CSP`, `HSTS` e `X-Frame-Options` estão configurados de forma explícita.
- [ ] Não há regressão funcional no frontend.
- [ ] Build backend passa.
- [ ] Constitution check registra conformidade com o Princípio II.

**Evidência esperada:** inspeção textual da configuração e execução de build/smoke mínima.

### SEC-011 - Endpoints públicos sem `[AllowAnonymous]`

#### TASK-011 - Explicitar endpoints de auth que são públicos

**O que fazer:** marcar explicitamente os endpoints de autenticação que devem permanecer públicos, reduzindo ambiguidade de política de acesso.

**Onde:** `server/API/Controllers/AuthController.cs`

**Definition of Done:**

- [ ] Endpoints públicos têm `[AllowAnonymous]` explícito onde aplicável.
- [ ] Endpoints protegidos continuam exigindo autenticação.
- [ ] Build backend passa.
- [ ] Constitution check registra conformidade com os Princípios I e II.

**Evidência esperada:** busca textual de atributos e build verde.

### SEC-012 - Validação fraca/implícita em DTOs de autenticação

#### TASK-012 - Endurecer DTOs de auth com validação explícita

**O que fazer:** adicionar validações mínimas obrigatórias aos DTOs de login e registro para bloquear payloads malformados antes da regra de negócio.

**Onde:** `server/Core/Application/DTOs/Auth/LoginDTO.cs`, `server/Core/Application/DTOs/Auth/RegistroDTO.cs`

**Definition of Done:**

- [ ] Campos obrigatórios e restrições mínimas estão declarados nos DTOs.
- [ ] Requisições inválidas falham na fronteira, não no miolo do fluxo.
- [ ] Build backend passa.
- [ ] Constitution check registra conformidade com os Princípios II e III.

**Evidência esperada:** diff dos DTOs e validação com payload inválido retornando erro determinístico.

### SEC-013 - Uso de `DateTime.Now` em fluxo financeiro

#### TASK-013 - Normalizar timestamps financeiros para UTC

**O que fazer:** substituir o uso de horário local por UTC nos fluxos financeiros afetados e registrar a regra como padrão.

**Onde:** `server/Core/UseCases/Investimento/RemoverInvestimentoUseCase.cs` e demais fluxos financeiros impactados pela revisão

**Definition of Done:**

- [ ] Não permanece `DateTime.Now` em fluxo financeiro abrangido pela mudança.
- [ ] As datas persistidas seguem UTC.
- [ ] Build backend passa.
- [ ] Constitution check registra conformidade com o Princípio IV.

**Evidência esperada:** busca textual sem `DateTime.Now` nos fluxos atingidos e build verde.

## §6 Constitution Check Explícito

| Princípio                               | Resultado                          | Justificativa binária                                                                                                           |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| I. Bounded Architecture                 | **Conforme**                       | O plano concentra mudanças em compose, controllers, serviços de token e DTOs sem introduzir dependência indevida entre camadas. |
| II. Security by Default                 | **Conforme**                       | O plano remove fallback fraco, reduz vazamento de erro, endurece autenticação e acrescenta validações/hardening.                |
| III. Quality Gates Executáveis          | **Conforme**                       | Cada tarefa tem evidência em comando repetível: grep, build, lint e audit.                                                      |
| IV. Data Integrity                      | **Conforme com atenção explícita** | O dia atual não altera lógica financeira; a decomposição de amanhã já inclui atomicidade e UTC para impedir regressão.          |
| V. Operability e Observabilidade Segura | **Conforme**                       | O plano mantém fail fast, validações auditáveis e não expõe detalhes internos ao cliente.                                       |

## §7 Critério de Fechamento do Dia

O dia só pode ser encerrado como concluído se todos os itens abaixo forem verdadeiros:

- [ ] SEC-008 fechado e evidência anexada.
- [ ] SEC-005 fechado em versão mínima segura e evidência anexada.
- [ ] SEC-007 fechado com audit, build e lint verdes.
- [ ] O pacote de evidências contém saída auditável para cada comando crítico.
- [ ] SEC-006 e SEC-009..013 estão quebrados em tarefas para amanhã, sem ambiguidade de escopo.
- [ ] Constitution check está registrado com resultado binário por princípio.
