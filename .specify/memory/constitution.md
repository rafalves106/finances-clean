<!--
Sync Impact Report
- Version change: template (sem versão) -> 1.0.0
- Editorial update (v1.0.0): acentuação em todo o documento + nota de roadmap para evolução de SHOULD -> MUST em Idempotência e Audit Trail na v1.1.0.
- Modified principles:
	- Principle 1 -> I. Bounded Architecture (NÃO NEGOCIÁVEL)
	- Principle 2 -> II. Security by Default
	- Principle 3 -> III. Quality Gates Executáveis
	- Principle 4 -> IV. Data Integrity
	- Principle 5 -> V. Operability e Observabilidade Segura
- Added sections:
	- Normas Técnicas Complementares
	- Fluxo de Entrega e Revisão
	- Nota de Roadmap de Princípios (compromisso evolutivo rastreável)
- Removed sections:
	- Nenhuma
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md
	- ✅ .specify/templates/spec-template.md
	- ✅ .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (diretório não existe neste repositório)
- Follow-up TODOs:
	- Nenhum
-->

# Finance Constitution

## Core Principles

### I. Bounded Architecture (NÃO NEGOCIÁVEL)

As fronteiras entre `Core`, `Infrastructure` e `API` MUST ser preservadas em toda
mudança. O `Core` MUST permanecer puro: não pode referenciar EF Core, ASP.NET Core,
Npgsql, BCrypt ou qualquer biblioteca de delivery/adapters. Dependências externas
MUST ficar em `Infrastructure` e orquestração HTTP/autenticação em `API`.
Rationale: reduz acoplamento, preserva testabilidade e evita regressão arquitetural
em um domínio financeiro de longa evolução.

### II. Security by Default

Segredos MUST permanecer fora do código e de arquivos versionados de ambiente real.
Autenticação/autorização MUST ser sempre server-side com validação de JWT no backend.
DTOs e logs MUST expor apenas o mínimo necessário; PII e dados financeiros sensíveis
MUST ser mascarados, omitidos ou agregados quando possível. CORS em produção MUST usar
allowlist explícita de origens.
Rationale: reduz superfície de ataque e impacto de vazamento de dados.

### III. Quality Gates Executáveis

Nenhum merge em branch principal pode ocorrer sem gates automatizados passando.
O PR MUST executar com sucesso, no mínimo: build backend, build frontend, lint frontend
e testes automatizados aplicáveis ao escopo alterado. A cobertura mínima de testes MUST
ser 70% das linhas alteradas no PR; abaixo disso exige justificativa formal aprovada na
revisão.
Rationale: evita regressão silenciosa e estabelece qualidade mensurável.

### IV. Data Integrity

Dados monetários MUST usar `decimal`/`numeric` com precisão explícita e nunca `float`
ou `double`. Operações financeiras críticas MUST usar transações explícitas com
fronteiras claras de commit/rollback. Toda migration EF Core MUST ser reversível e
testada em ambiente de homologação. Datas persistidas e trafegadas entre serviços MUST
estar em UTC.
Rationale: consistência financeira e rastreabilidade dependem de determinismo numérico
e temporal.

### V. Operability e Observabilidade Segura

As rotas `/health` e `/ready` MUST permanecer separadas e semanticamente corretas.
Logs MUST ser estruturados e correlacionáveis, sem PII, segredos ou payloads sensíveis.
Falhas operacionais MUST produzir sinais acionáveis (nível, contexto e causa técnica)
para diagnóstico rápido sem expor dados de usuário.
Rationale: operação confiável exige diagnóstico rápido com risco mínimo de exposição.

## Normas Técnicas Complementares

- API Contract Sync: todo endpoint novo ou alterado MUST atualizar o contrato OpenAPI.
  Quando o frontend adotar TypeScript, tipos de cliente MUST ser gerados a partir do
  OpenAPI; modelos escritos manualmente para contratos HTTP ficam proibidos.
- Idempotência: criação/atualização de operações financeiras críticas (movimentações,
  aportes, saques e liquidações) SHOULD oferecer mecanismo de idempotência em chamadas
  repetidas, com chave de deduplicação quando aplicável.
- Audit Trail: alterações de CRUD financeiro SHOULD produzir trilha auditável mínima
  (quem, quando, operação e identificador do recurso), sem registrar dados sensíveis.
- Convenções de código MUST ser respeitadas: PascalCase no backend, camelCase em JS/TS,
  e sufixos padronizados (`Controller`, `UseCase`, `Repository`, `Service`, `Dto`).

**Nota de Roadmap de Princípios (v1.0.0)**: Idempotência e Audit Trail permanecem como
SHOULD na v1.0.0 por refletirem o estado atual do projeto. Esses dois itens MUST ser
promovidos para MUST na v1.1.0 quando a primeira feature financeira nova for
implementada. Esta nota formaliza um compromisso de evolução rastreável.

## Fluxo de Entrega e Revisão

- Toda PR MUST explicitar impacto arquitetural (Core/Infrastructure/API/client) e risco
  de segurança/integridade de dados.
- Toda PR MUST anexar evidência de execução dos gates aplicáveis.
- Mudanças que violam algum princípio MUST incluir seção de exceção arquitetural com
  prazo de remediação e aprovação explícita de maintainers.
- Mudanças em contratos de API MUST ser acompanhadas de atualização de consumidores.
- Mudanças em schema/migrations MUST incluir plano de rollback testado.

## Governance

Esta Constitution prevalece sobre convenções locais e documentos auxiliares em caso de
conflito. Emendas MUST registrar motivação, impacto e plano de migração (quando houver),
além de atualizar templates afetados no mesmo ciclo.

Política de versionamento da Constitution (SemVer):

- MAJOR: remoção ou redefinição incompatível de princípios/governança.
- MINOR: adição de princípio, seção obrigatória ou expansão normativa material.
- PATCH: clarificações textuais, correção editorial e ajustes sem mudança normativa.

Revisão de conformidade MUST ocorrer em toda PR e em auditoria mensal leve do repositório,
com verificação de: fronteiras de arquitetura, segurança, quality gates, integridade de
dados e operabilidade.

**Version**: 1.0.0 | **Ratified**: 2026-05-19 | **Last Amended**: 2026-05-19
