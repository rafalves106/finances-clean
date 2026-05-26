# Tasks — Versionamento e Release Notes Automaticas (Ciclo 4)

**Input**: `specs/004-release-notes-versioning-ciclo-4/spec.md`, `specs/004-release-notes-versioning-ciclo-4/plan.md`

## Ordem de Execucao

1. Data/Config de versao (changelog + package + vite define)
2. Dominio frontend (parser/util)
3. UI (modal + integracao em App + rodape versao)
4. Testes e validacao final

## TASK-01 — Padronizar CHANGELOG para semver e registrar 0.4.0

**O que fazer:** converter headers publicados para `## [0.X.0]`, manter conteudo existente e criar secao da versao `0.4.0` para esta feature. (Ref: Plan §2, §3, ADR-1)
**Onde:** `CHANGELOG.md`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-02
**Reusar:** conteudo atual do changelog
**Complexidade:** S
**Definition of Done:**

- [ ] Headers de ciclos publicados convertidos para semver
- [ ] Secao `## [0.4.0]` criada com notas da feature
- [ ] Changelog permanece legivel para GitHub e para parser local
- [ ] Sem violacoes da constitution

## TASK-02 — Normalizar baseline e bump de versao no frontend

**O que fazer:** refletir baseline `0.3.0` (ciclo anterior) e bump para `0.4.0` no `client/package.json`, com rastreabilidade no changelog. (Ref: Plan §2, §7)
**Onde:** `client/package.json`
**Depende de:** Nenhuma
**Pode ser paralela com:** TASK-01
**Reusar:** processo atual de versionamento no npm
**Complexidade:** S
**Definition of Done:**

- [ ] `version` em `client/package.json` definido como `0.4.0`
- [ ] Divergencia anterior (`0.0.0`) documentada no PR/spec
- [ ] Sem violacoes da constitution

## TASK-03 — Injetar VITE_APP_VERSION no build do Vite

**O que fazer:** configurar `define` no `vite.config.js` para expor `import.meta.env.VITE_APP_VERSION` a partir da versao do `package.json`. (Ref: Plan §1, §3)
**Onde:** `client/vite.config.js`
**Depende de:** TASK-02
**Pode ser paralela com:** TASK-04
**Reusar:** configuracao existente de Vite
**Complexidade:** S
**Definition of Done:**

- [ ] Define de versao configurado sem quebrar server/test config
- [ ] Versao disponivel em runtime no client
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm run build` passa

## TASK-04 — Criar util de parse da secao atual do CHANGELOG

**O que fazer:** implementar parser puro para extrair secao `## [currentVersion]` de uma string raw de changelog, com fallback silencioso. (Ref: Plan §2, §3, §4)
**Onde:** `client/src/util/releaseNotes.js`
**Depende de:** TASK-02
**Pode ser paralela com:** TASK-03
**Reusar:** utilitarios de padrao funcional ja existentes em `client/src/util/`
**Complexidade:** M
**Definition of Done:**

- [ ] Parser retorna conteudo da secao correta por versao exata
- [ ] Parser interrompe na proxima secao de mesmo nivel
- [ ] Ausencia de secao retorna vazio/null sem excecao
- [ ] Sem violacoes da constitution
- [ ] Testes unitarios do parser implementados e verdes

## TASK-05 — Implementar ReleaseNotesModal de exibicao unica por versao

**O que fazer:** criar `ReleaseNotesModal.jsx` para renderizar conteudo parseado, abrir quando `last_seen != current_version` e persistir `finance_last_seen_version` ao confirmar/fechar. (Ref: Plan §1, §3, ADR-2)
**Onde:** `client/src/components/ReleaseNotesModal.jsx`
**Depende de:** TASK-03, TASK-04
**Pode ser paralela com:** TASK-06
**Reusar:** padrao visual/comportamental de modal existente (ex.: `TransactionModal.jsx`)
**Complexidade:** M
**Definition of Done:**

- [ ] Modal abre apenas quando versao for nova para usuario
- [ ] Modal nao abre quando versao ja tiver sido vista
- [ ] Persistencia em `finance_last_seen_version` implementada com tratamento defensivo
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm test` passa

## TASK-06 — Integrar release notes e versao visivel no App

**O que fazer:** importar `CHANGELOG.md?raw`, integrar parser/modal no fluxo autenticado e exibir `v{VITE_APP_VERSION}` no rodape do sidebar em `App.jsx`. (Ref: Plan §2, §3, ADR-3)
**Onde:** `client/src/App.jsx`
**Depende de:** TASK-05
**Pode ser paralela com:** Nenhuma
**Reusar:** estrutura atual de sidebar e estado autenticado
**Complexidade:** M
**Definition of Done:**

- [ ] Fluxo de deteccao executa apenas no contexto autenticado
- [ ] Rodape da sidebar exibe versao atual em todas as abas autenticadas
- [ ] Falhas no parser/localStorage nao derrubam o app
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm run lint` passa
- [ ] `cd client && npm run build` passa
- [ ] `cd client && npm test` passa

## TASK-07 — Cobrir testes automatizados do fluxo de release notes

**O que fazer:** adicionar testes para parser, regra de exibicao unica, fallback sem secao e exibicao da versao no sidebar. (Ref: Plan §4, §7)
**Onde:** `client/src/util/releaseNotes.test.js`, `client/src/components/ReleaseNotesModal.test.jsx`, `client/src/App.test.jsx` (ou arquivos equivalentes)
**Depende de:** TASK-04, TASK-05, TASK-06
**Pode ser paralela com:** Nenhuma
**Reusar:** stack de testes atual (`vitest`, `@testing-library/react`)
**Complexidade:** M
**Definition of Done:**

- [ ] Cenarios de exibicao (novo x ja visto) cobertos
- [ ] Cenarios de fallback (sem secao/localStorage indisponivel) cobertos
- [ ] Exibicao da versao no sidebar coberta
- [ ] Sem violacoes da constitution
- [ ] `cd client && npm test` passa

## Gate Operacional Obrigatorio (ao final de cada task com codigo)

1. Executar `cd client && npm run lint`.
2. Executar `cd client && npm run build`.
3. Executar `cd client && npm test`.
4. Se qualquer comando falhar, corrigir antes da proxima task.
