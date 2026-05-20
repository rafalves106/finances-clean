# Tasks — Ciclo 1 (Eliminar Críticos de Segurança)

> Nota de dependência operacional crítica: TASK-09 (rotação/revogação de credenciais) DEVE estar concluída antes da TASK-12 (force push), mesmo podendo ocorrer em paralelo à TASK-10 (backup/mirror).

## Onda 1 — SEC-001 + SEC-003 (Limpeza HEAD) — 5h estimadas

### TASK-01 — Remover segredos reais do appsettings de runtime

**O que fazer:** Atualizar server/API/appsettings.json para remover PostgresConnection, Jwt.Key e AdminKey reais do HEAD, mantendo apenas placeholders seguros e sem fallback sensível, conforme plan §2 (Componentes), §3.1 (Segredo via ambiente) e §4 (validação SEC-001).
**Onde:** server/API/appsettings.json
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-02
**Reusar:** server/API/appsettings.Example.json como modelo de placeholders
**Esforço:** S
**SEC remediada:** SEC-001
**Definition of Done:**

- O arquivo não contém valores reais de PostgresConnection, Jwt.Key e AdminKey.
- A validação de exemplo seguro é possível com: grep -nE 'PostgresConnection|"Key"|AdminKey' server/API/appsettings.Example.json retornando apenas exemplos não sensíveis.
- Sem violações da constitution (princípios I e II).
- Build passa (dotnet build).
- App sobe sem erro de configuração quando variáveis obrigatórias são fornecidas.

### TASK-02 [P] — Tirar appsettings real do versionamento e reforçar bootstrap seguro

**O que fazer:** Garantir que server/API/appsettings.json não permaneça versionado e documentar bootstrap local sem segredo em arquivo versionado, aproveitando arquivo de exemplo existente, conforme plan §2 (appsettings.json + appsettings.Example.json) e §4 (validação SEC-001).
**Onde:** server/.gitignore; server/API/appsettings.Example.json; docs/runbooks/migrations-prod.md
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-01
**Reusar:** server/API/appsettings.Example.json
**Esforço:** M
**SEC remediada:** SEC-001
**Definition of Done:**

- git -C server ls-files | grep -E '^API/appsettings\.json$' retorna saída vazia.
- appsettings.Example.json mantém somente placeholders (sem segredos da auditoria).
- Runbook descreve bootstrap local/prod com variáveis de ambiente obrigatórias.
- Sem violações da constitution (princípios II e V).
- Build passa (dotnet build).
- App sobe sem erro de configuração quando variáveis obrigatórias são fornecidas.

### TASK-03 — Eliminar senha hardcoded da migration de autenticação

**O que fazer:** Remover uso de senha literal __REDACTED_BOOTSTRAP_PASSWORD__ na migration 20260422214104_AddAuth_UsuarioId.cs, migrando para estratégia sem segredo hardcoded no HEAD, conforme plan §2 (migration SEC-003), §3.1 e §4 (validação SEC-003).
**Onde:** server/Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs
**Depende de:** TASK-01
**Pode ser paralela com:** Nenhuma
**Reusar:** Fluxo de criação de usuário/admin já existente em server/Core/UseCases/Auth
**Esforço:** M
**SEC remediada:** SEC-003
**Definition of Done:**

- grep -RIn '__REDACTED_BOOTSTRAP_PASSWORD__' server/Infrastructure/Migrations retorna saída vazia.
- grep -RIn 'HashPassword\("' server/Infrastructure/Migrations não evidencia senha literal em seed da migration-alvo.
- A migration permanece compilável e sem dependência de segredo em código.
- Sem violações da constitution (princípios I, II e IV).
- Build passa (dotnet build).
- App sobe sem erro de configuração se aplicável.

### TASK-04 — Implementar bootstrap manual seguro para admin inicial

**O que fazer:** Definir procedimento explícito para criação inicial de admin sem senha previsível, com senha temporária de uso único e troca obrigatória imediata, mitigando risco operacional após remoção do seed hardcoded, conforme plan §7 (risco de bootstrap), §8 ADR-3 e spec FR-002.
**Onde:** docs/runbooks/migrations-prod.md; server/API/Controllers/AuthController.cs; server/Core/UseCases/Auth
**Depende de:** TASK-03
**Pode ser paralela com:** Nenhuma
**Reusar:** Fluxo de registro/autenticação já disponível em server/API/Controllers/AuthController.cs
**Esforço:** M
**SEC remediada:** SEC-003
**Definition of Done:**

- Existe procedimento executável para bootstrap admin sem senha fixa em migration.
- Procedimento inclui etapa obrigatória de rotação/troca imediata da senha temporária.
- Evidência operacional registrada no runbook para evitar bloqueio de acesso inicial.
- Sem violações da constitution (princípios II e V).
- Build passa (dotnet build).
- App sobe sem erro de configuração se aplicável.

### TASK-05 — Validar critérios de saída da Onda 1 por comandos auditáveis

**O que fazer:** Executar e registrar os comandos de validação da plan §4 para SEC-001 e SEC-003, comprovando limpeza do HEAD e ausência de hardcode crítico, conforme plan §5 (critério de saída da Onda 1).
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/onda-1-validacao.md
**Depende de:** TASK-01, TASK-02, TASK-03, TASK-04
**Pode ser paralela com:** Nenhuma
**Reusar:** Comandos já definidos no plan §4
**Esforço:** S
**SEC remediada:** SEC-001
**Definition of Done:**

- git -C server ls-files | grep -E '^API/appsettings\.json$' retorna vazio.
- grep -nE 'PostgresConnection|"Key"|AdminKey' server/API/appsettings.Example.json não retorna segredo real.
- grep -RIn '__REDACTED_BOOTSTRAP_PASSWORD__' server/Infrastructure/Migrations retorna vazio.
- grep -RIn 'HashPassword\("' server/Infrastructure/Migrations confirma ausência de senha literal na migration-alvo.
- Sem violações da constitution (princípios II e III).
- Build passa (dotnet build).
- App sobe sem erro de configuração com variáveis definidas.

## Onda 2 — SEC-002 (CORS Allowlist) — 4-5h

### TASK-06 — Substituir AllowAnyOrigin por allowlist explícita em Program

**O que fazer:** Alterar política CORS no startup para WithOrigins com lista explícita vinda de configuração, removendo AllowAnyOrigin e mantendo comportamento previsível por ambiente, conforme plan §2 (Program.cs), §3.2 (fluxo CORS) e §4 (validação SEC-002).
**Onde:** server/API/Program.cs
**Depende de:** TASK-05
**Pode ser paralela com:** TASK-07
**Reusar:** Estrutura existente de configuration e startup no Program.cs
**Esforço:** M
**SEC remediada:** SEC-002
**Definition of Done:**

- grep -RIn 'AllowAnyOrigin' server/API/Program.cs retorna saída vazia.
- grep -RIn 'WithOrigins' server/API/Program.cs retorna pelo menos uma ocorrência válida.
- CORS passa a depender de allowlist explícita e não de regra global permissiva.
- Sem violações da constitution (princípios II e V).
- Build passa (dotnet build).
- App sobe sem erro de configuração quando CORS_ALLOWED_ORIGINS está definido.

### TASK-07 [P] — Implementar fail fast de CORS_ALLOWED_ORIGINS e instruções operacionais

**O que fazer:** Adicionar validação de configuração para falhar startup quando CORS_ALLOWED_ORIGINS estiver vazio em ambiente não local e documentar formato esperado (lista por vírgula), conforme plan §3.2 e §4 (erros esperados).
**Onde:** server/API/Program.cs; docker-compose.yml; docs/runbooks/migrations-prod.md
**Depende de:** TASK-05
**Pode ser paralela com:** TASK-06
**Reusar:** Padrão existente de leitura de configuração no Program.cs
**Esforço:** S
**SEC remediada:** SEC-002
**Definition of Done:**

- Startup falha com mensagem explícita quando CORS_ALLOWED_ORIGINS está ausente/vazio em produção.
- Startup ocorre sem erro quando a variável está preenchida corretamente.
- Runbook e compose documentam variáveis obrigatórias sem fallback inseguro para produção.
- Sem violações da constitution (princípios II e V).
- Build passa (dotnet build).
- App sobe sem erro de configuração quando variável obrigatória é fornecida.

### TASK-08 — Validar critérios de saída da Onda 2 por comandos auditáveis

**O que fazer:** Executar e registrar validação SEC-002 com comandos da plan §4 e teste manual de origem não permitida bloqueada no browser, conforme plan §5 (critério de saída da Onda 2).
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/onda-2-validacao.md
**Depende de:** TASK-06, TASK-07
**Pode ser paralela com:** Nenhuma
**Reusar:** Comandos de validação SEC-002 já definidos no plan §4
**Esforço:** S
**SEC remediada:** SEC-002
**Definition of Done:**

- grep -RIn 'AllowAnyOrigin' server/API/Program.cs retorna vazio.
- grep -RIn 'WithOrigins' server/API/Program.cs retorna ocorrência válida com allowlist.
- Evidência manual registrada: origem não permitida sem Access-Control-Allow-Origin.
- Sem violações da constitution (princípios II e III).
- Build passa (dotnet build).
- App sobe sem erro de configuração com allowlist válida.

## Onda 3 — SEC-004 (Rotação + Histórico) — 5h

### TASK-09 — Preparar inventário e rotação/revogação de 100% dos segredos comprometidos

**O que fazer:** Consolidar inventário de segredos comprometidos (PostgresConnection, Jwt.Key, AdminKey, senha seed) e executar rotação/revogação com evidência para cada item, conforme plan §0 (KPI 100%), §4 (SEC-004) e §8 ADR-3.
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/rotacao-segredos.md; docs/runbooks/migrations-prod.md
**Depende de:** TASK-08
**Pode ser paralela com:** TASK-10
**Reusar:** Lista de segredos e commits da auditoria .specify/audits/security-2026-05-19.md
**Esforço:** M
**SEC remediada:** SEC-004
**Definition of Done:**

- Cada segredo comprometido tem status final (rotacionado ou revogado) com timestamp e evidência.
- Nenhum segredo antigo permanece ativo após validação funcional da API.
- Checklist registra ordem segura: gerar novo, aplicar, validar, revogar antigo.
- Sem violações da constitution (princípios II e V).
- Build passa (dotnet build).
- App sobe sem erro de configuração com segredos novos.

### TASK-10 [P] — Criar backup/mirror antes de qualquer rewrite destrutivo

**O que fazer:** Criar clone mirror de segurança e checkpoint operacional antes de reescrita do histórico, com rollback explícito em caso de falha, conforme plan §7 (risco rewrite) e estratégia de rollback da Onda 3.
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/rewrite-historico.md; docs/runbooks/migrations-prod.md
**Depende de:** TASK-08
**Pode ser paralela com:** TASK-09
**Reusar:** Runbook de produção já existente em docs/runbooks/migrations-prod.md
**Esforço:** S
**SEC remediada:** SEC-004
**Definition of Done:**

- Mirror/backup validado antes da execução de git-filter-repo.
- Checklist inclui comando de restauração do mirror em caso de falha.
- Janela operacional e freeze de merges registrados antes do rewrite.
- Sem violações da constitution (princípios III e V).
- Build passa (dotnet build) após restauração de teste, se aplicável.
- App sobe sem erro de configuração se aplicável.

### TASK-11 — Executar dry-run de git-filter-repo em clone espelho

**O que fazer:** Rodar git-filter-repo em clone espelho para remover segredos históricos listados no plan §4, validar resultado com comandos git log -S antes do push final e documentar rollback, conforme plan §8 ADR-2.
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/rewrite-historico.md
**Depende de:** TASK-10
**Pode ser paralela com:** Nenhuma
**Reusar:** Padrões de busca por segredos definidos no plan §4
**Esforço:** M
**SEC remediada:** SEC-004
**Definition of Done:**

- Dry-run concluído sem perda de refs necessárias para operação.
- Comandos git log --all -S dos segredos críticos retornam vazio no espelho tratado.
- Procedimento de rollback do espelho é executável e documentado.
- Rollback testado em cópia secundária com sucesso.
- Sem violações da constitution (princípios II, III e V).
- Build passa (dotnet build) no espelho pós-rewrite.
- App sobe sem erro de configuração se aplicável.

### TASK-12 — Executar force push controlado da reescrita de histórico

**O que fazer:** Publicar rewrite validado via force push controlado, com comunicação operacional e plano de reversão imediato caso referência crítica seja perdida, conforme plan §7 (risco force push) e rollback Onda 3.
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/rewrite-historico.md
**Depende de:** TASK-11, TASK-09
**Pode ser paralela com:** Nenhuma
**Reusar:** Checklist de janela operacional da TASK-10
**Esforço:** M
**SEC remediada:** SEC-004
**Definition of Done:**

- Force push executado somente após confirmação do dry-run e backup válido.
- Branches/tags críticas verificadas após publicação.
- Plano de reversão (restaurar mirror) permanece pronto e testado.
- Sem violações da constitution (princípios III e V).
- Build passa (dotnet build) no repositório publicado.
- App sobe sem erro de configuração se aplicável.

### TASK-13 — Sincronizar servidor caseiro com re-clone seguro pós-rewrite

**O que fazer:** Re-sincronizar produção caseira por re-clone limpo após force push, validar saúde operacional e registrar rollback para snapshot anterior, conforme plan §2 (servidor caseiro), §5 (critério de saída Onda 3) e §7 (risco de desalinhamento).
**Onde:** docs/runbooks/migrations-prod.md; specs/001-eliminar-criticos-seguranca/checklists/rewrite-historico.md
**Depende de:** TASK-12
**Pode ser paralela com:** Nenhuma
**Reusar:** Endpoints operacionais já existentes /health e /ready
**Esforço:** M
**SEC remediada:** SEC-004
**Definition of Done:**

- Re-clone do servidor caseiro concluído sem referência ao histórico antigo.
- Health checks operacionais validados após sincronização.
- Janela de manutenção definida antes da execução da sincronização.
- Tempo estimado de downtime documentado no runbook/checklist da execução.
- Plano de notificação prévia registrado antes da janela de manutenção.
- Procedimento de retorno para snapshot anterior registrado e executável.
- Sem violações da constitution (princípios V e II).
- Build passa (dotnet build) no ambiente sincronizado.
- App sobe sem erro de configuração com segredos rotacionados.

### TASK-14 — Validar critérios de saída da Onda 3 por comandos auditáveis

**O que fazer:** Executar validação SEC-004 da plan §4 no repositório final e anexar evidências de rotação/revogação, garantindo fechamento da Onda 3 com critérios binários, conforme plan §5.
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/onda-3-validacao.md
**Depende de:** TASK-09, TASK-10, TASK-11, TASK-12, TASK-13
**Pode ser paralela com:** Nenhuma
**Reusar:** Comandos SEC-004 da plan §4
**Esforço:** S
**SEC remediada:** SEC-004
**Definition of Done:**

- git log --all -S '__REDACTED_JWT_KEY__' -- server/API/appsettings.json retorna vazio.
- git log --all -S '#pUz]pA$[x0=MyxeNwCpy_qf>CTH^yF\*' -- server/API/appsettings.json retorna vazio.
- git log --all -S 'Password=__REDACTED_DB_PASSWORD__' -- server/API/appsettings.json retorna vazio.
- git log --all -S '__REDACTED_BOOTSTRAP_PASSWORD__' -- server/Infrastructure/Migrations/20260422214104_AddAuth_UsuarioId.cs retorna vazio.
- Sem violações da constitution (princípios II, III e V).
- Build passa (dotnet build).
- App sobe sem erro de configuração após rewrite e rotação.

### TASK-15 — Executar reauditoria final e declarar KPI de fechamento

**O que fazer:** Rodar pacote final de reauditoria do ciclo 1 (todos os comandos da plan §4) e emitir evidência consolidada de 0 críticos abertos, conforme spec SC-001, SC-002, SC-003 e briefing (KPI de fechamento).
**Onde:** specs/001-eliminar-criticos-seguranca/checklists/reauditoria-final.md; .specify/audits/security-2026-05-19.md
**Depende de:** TASK-14
**Pode ser paralela com:** Nenhuma
**Reusar:** Base de auditoria existente em .specify/audits/security-2026-05-19.md
**Esforço:** S
**SEC remediada:** SEC-004
**Definition of Done:**

- Todos os comandos de validação do plan §4 executados com evidência anexada.
- Resultado final indica 0 achados críticos abertos no escopo SEC-001..004.
- Evidência de 100% dos segredos comprometidos rotacionados/revogados está anexada.
- Briefing atualizado com status FECHADO, data de fechamento e commit hash de referência.
- Issue/tarefa de início do ciclo 2 criada com base no Backlog Pós-Ciclo.
- Sem violações da constitution (princípios I a V).
- Build passa (dotnet build).
- App sobe sem erro de configuração no cenário operacional final.

## Backlog Pós-Ciclo (Fora do escopo)

- SEC-005: padronizar tratamento de erros sem ex.Message em resposta HTTP.
- SEC-006: introduzir transações explícitas em operações financeiras multi-escrita.
- SEC-007: atualizar dependências npm com vulnerabilidades high/moderate.
- SEC-008: remover fallback fraco de ADMIN_KEY no compose para todos os ambientes.
- SEC-009 a SEC-013: endurecimento incremental (JWT TTL, headers HTTP, validações DTO, UTC e demais melhorias não críticas).
