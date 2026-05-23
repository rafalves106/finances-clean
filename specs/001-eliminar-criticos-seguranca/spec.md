# Feature Specification: Eliminar Críticos de Segurança

**Feature Branch**: `001-eliminar-criticos-seguranca`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "Com base no briefing docs/briefings/retomada-seguranca-ciclo-1.md, conduza o fluxo Spec Kit para o ciclo 1 focado em eliminar achados críticos de segurança, com escopo estrito em risco crítico direto e capacidade de 5h/semana."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Neutralizar segredos ativos (Priority: P1)

Como único responsável do produto, Rafael precisa remover segredos comprometidos ainda ativos e garantir rotação/revogação para impedir uso indevido imediato.

**Why this priority**: reduz risco de comprometimento ativo de forma direta e imediata.

**Independent Test**: pode ser testada isoladamente verificando que não há segredo ativo em artefatos versionados da revisão atual e que todos os segredos comprometidos possuem evidência de rotação/revogação.

**Acceptance Scenarios**:

1. **Given** que existem segredos comprometidos no ciclo atual, **When** a remediação é concluída, **Then** nenhum segredo sensível permanece exposto na revisão atual do repositório.
2. **Given** que os segredos foram historicamente expostos, **When** o ciclo é encerrado, **Then** existe evidência rastreável de rotação/revogação de cada segredo comprometido.

---

### User Story 2 - Remover exposição crítica no histórico (Priority: P2)

Como mantenedor único, Rafael precisa reduzir a exposição histórica de credenciais no controle de versão com um procedimento seguro para ambiente caseiro de produção.

**Why this priority**: sem tratar histórico e operação local de produção, o risco crítico persiste mesmo após limpeza na revisão atual.

**Independent Test**: pode ser testada isoladamente com evidências de higienização de histórico aplicável e plano de sincronização seguro para clones/ambientes ainda vulneráveis.

**Acceptance Scenarios**:

1. **Given** que há credenciais expostas em revisões anteriores, **When** o procedimento de contenção é executado, **Then** existe evidência objetiva de que o histórico aplicável foi higienizado ou isolado e que o ambiente de produção local foi sincronizado com segurança.
2. **Given** que existem cópias antigas do repositório, **When** o ciclo é fechado, **Then** há instruções executadas e verificadas para impedir reutilização de credenciais antigas.

---

### Edge Cases

- O que acontece se uma credencial já tiver sido revogada externamente e não puder ser rotacionada novamente? O ciclo deve registrar evidência de revogação efetiva e substituir por novo segredo válido apenas quando necessário para continuidade operacional.
- O que acontece se a limpeza de histórico quebrar sincronização com o servidor caseiro? O ciclo deve incluir procedimento de contingência e validação operacional pós-sincronização antes do fechamento.
- O que acontece se a reauditoria identificar apenas achados altos (não críticos)? O ciclo 1 é considerado concluído se e somente se não houver achados críticos; achados altos permanecem para ciclo posterior.

## Ciclo Closing Criteria _(mandatory)_

O fechamento do ciclo 1 exige conformidade com os seguintes critérios objetivos, sem os quais a remediação não pode ser declarada concluída:

### Auditoria de Fechamento

1. **Reauditoria de Segurança**: Executar auditoria reprodutível usando o mesmo critério da auditoria base (`.specify/audits/security-2026-05-19.md`). O resultado MUST apresentar **0 achados críticos abertos**.
   - Ferramenta/comando: a ser definido no plan (ex.: `security_audit.sh`).
   - Evidência: relatório de saída com timestamp.

2. **Pacote de Evidências**: Documentar evidência objetiva para cada achado crítico tratado.
   - SEC-001: Comando de verificação que não encontra segredo real em `appsettings.json` do HEAD.
   - SEC-003: Commit/migration sem hardcode de senha em seed do banco.
   - SEC-004: Log ou relatório de rotação/revogação de cada segredo comprometido.
   - SEC-002: Configuração CORS com allowlist explícita ativa.

### Plano e Priorização

3. **Ondas Curtas**: O plano de execução MUST estar dividido em ondas de duração compatível com 5h/semana, com dependências explícitas entre ondas.

4. **Tarefas Priorizadas por Risco**: Cada tarefa MUST estar ordenada por impacto de redução de risco imediato (ex.: SEC-001 antes de SEC-004, pois remove risco ativo no HEAD).

5. **Rastreabilidade**: Cada tarefa MUST citar qual achado crítico ela endereça (SEC-001, SEC-002, SEC-003 ou SEC-004).

### Constitution Check

6. **Conformidade por Princípio**: O plano MUST registrar validação contra cada princípio da Constitution v1.0.0 (I-V), com resultado binário (conforme/não conforme) e exceções temporárias (se houver) com prazo.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 [SEC-001]**: O ciclo 1 MUST remover todos os segredos sensíveis (PostgresConnection, Jwt.Key, AdminKey) do arquivo `appsettings.json` do backend, substituindo por placeholders ou variáveis de ambiente.
- **FR-002 [SEC-003]**: O ciclo MUST eliminar credencial hardcoda no seed de migration (`__REDACTED_BOOTSTRAP_PASSWORD__`), substituindo por procedimento seguro de bootstrap ou removendo seed padrão.
- **FR-003 [SEC-004]**: O ciclo MUST conter procedimento explícito de rotação/revogação para cada segredo comprometido (PostgresConnection, Jwt.Key, AdminKey, senha de seed) com evidência registrada.
- **FR-004 [SEC-004]**: O ciclo MUST reduzir exposição histórica do repositório, com instruções reprodutíveis para sincronizar ambiente caseiro de produção com segurança pós-contenção.
- **FR-005 [SEC-002]**: O ciclo MUST substituir política CORS permissiva (`AllowAnyOrigin`) por allowlist explícita de origens em ambientes não locais.
- **FR-006 [Escopo]**: O ciclo MUST manter fora de escopo itens classificados como altos e não críticos, incluindo operações sem transação (S6) e vulnerabilidades npm (SEC-007).
- **FR-007**: O ciclo MUST registrar constitution check explícito por princípio (I-V), com resultado de conformidade e exceções (se houver).
- **FR-008**: O ciclo MUST gerar plano de execução em ondas curtas e tarefas priorizadas por impacto de redução de risco imediato.

### Constitution Alignment _(mandatory)_

- **CA-001 Architecture (Princípio I - Bounded Architecture)**: a remediação deve preservar fronteiras entre domínio, infraestrutura e entrega; mudanças de segurança não podem introduzir acoplamento indevido entre camadas.
- **CA-002 Security (Princípio II - Security by Default)**: segredos não podem permanecer em artefatos versionados de ambiente real; controles de acesso e exposição de dados devem operar com mínimo privilégio e mínimo vazamento.
- **CA-003 Quality Gates (Princípio III - Quality Gates Executáveis)**: a conclusão do ciclo exige execução de verificações reprodutíveis para comprovar ausência de críticos e estabilidade mínima após remediações.
- **CA-004 Data Integrity (Princípio IV - Data Integrity)**: correções do ciclo não podem degradar consistência de dados financeiros nem introduzir comportamento não determinístico em operações existentes.
- **CA-005 Operability (Princípio V - Operability e Observabilidade Segura)**: o ciclo deve manter capacidade de operação e diagnóstico seguro após contenção de segredos e ajustes de configuração.

### Key Entities _(include if feature involves data)_

- **AchadoCritico**: item de risco classificado como crítico, com identificador, evidências, impacto e status de remediação.
- **SegredoComprometido**: credencial/tokens expostos, com origem, estado (ativo/inativo), ação aplicada (rotação/revogação) e data de comprovação.
- **EvidenciaRemediacao**: prova objetiva de ação realizada, incluindo comando/procedimento, resultado esperado e validação final.
- **OndaExecucao**: bloco curto de trabalho alinhado à capacidade semanal, com objetivo, dependências e critério de saída.
- **TarefaRisco**: ação executável priorizada por redução de risco imediato, com dono, ordem e definição de pronto.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A reauditoria de fechamento retorna 0 achados críticos abertos usando o mesmo critério da auditoria base.
- **SC-002**: 100% dos segredos comprometidos no escopo crítico possuem evidência registrada de rotação ou revogação.
- **SC-003**: 100% dos achados críticos do ciclo estão com status fechado e evidência verificável vinculada.
- **SC-004**: O plano do ciclo está organizado em ondas curtas com duração compatível com 5h/semana e dependências explícitas entre ondas.
- **SC-005**: 100% das tarefas do ciclo estão ordenadas por risco imediato e possuem critério de aceite auditável.
- **SC-006**: O item S6 (alto, não crítico) permanece fora do ciclo 1 e registrado formalmente como backlog de ciclo posterior.

## Assumptions

- Rafael atua como único dev/PO/usuário e executará o ciclo em blocos semanais de até 5 horas.
- A prioridade absoluta do ciclo 1 é contenção de risco crítico direto, sem expansão para melhorias amplas de qualidade ou UX.
- O relatório `.specify/audits/security-2026-05-19.md` é a linha de base oficial para definição de críticos deste ciclo.
- O ambiente caseiro de produção exige procedimento cuidadoso de sincronização após ações de histórico e credenciais.
- Achados altos e médios serão tratados em ciclos seguintes, salvo se forem reclassificados como críticos durante reauditoria.
