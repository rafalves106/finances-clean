# Briefing — Versionamento e Release Notes Automáticas (Ciclo 4)

> Capturado em: 26 de maio de 2026
> Por: 🧭 Discovery Agent (com Rafael)
> Status: 🟢 Pronto pra Architect

## 1. Persona

Rafael (único dev, PO e usuário). Usa o app diariamente e quer saber, ao reabrir após uma atualização, o que mudou — sem precisar ir ao GitHub.

## 2. Dor real

Após cada deploy, Rafael não tem feedback visual de que o app foi atualizado nem do que mudou. O CHANGELOG existe mas está enterrado no repositório. Não há versão visível na UI. O app parece estático.

## 3. Valor entregue

Ao reabrir o app após uma nova versão ser deployada, Rafael vê automaticamente um modal com as notas da versão atual. A versão atual fica sempre visível no sidebar. O app passa a ter identidade de produto com versionamento explícito.

## 4. Critério de sucesso (KPIs)

- Modal aparece automaticamente na primeira abertura após versão nova (e só uma vez)
- Modal NÃO aparece se a versão não mudou desde a última abertura
- Versão visível no rodapé do sidebar em todas as telas autenticadas
- Conteúdo do modal vem do CHANGELOG.md sem nenhuma edição manual adicional
- `npm test` continua passando após as mudanças

## 5. Escopo

**Dentro:**
- Atualizar `client/package.json` para versão `0.3.0` (Ciclo 3 entregue) — a feature deste ciclo será `0.4.0`
- Atualizar `CHANGELOG.md` para usar headers semver `## [0.X.0]` em vez de `## [Ciclo X - ...]` (mantendo o mesmo conteúdo)
- Vite injeta versão do `package.json` como variável de ambiente (`import.meta.env.VITE_APP_VERSION`) via `define` no `vite.config.js`
- `CHANGELOG.md` importado no bundle via Vite raw import (`?raw`)
- Lógica de detecção: comparar `import.meta.env.VITE_APP_VERSION` com `localStorage.getItem('finance_last_seen_version')` — se diferente, mostra modal e atualiza o localStorage
- Novo componente `ReleaseNotesModal.jsx` com conteúdo parseado do CHANGELOG (seção da versão atual)
- Exibir número de versão no rodapé do sidebar em `App.jsx`

**Fora (explicitamente):**
- Notificações push ou e-mail de atualização
- Histórico de versões anteriores navegável (só mostra a versão atual)
- Backend envolvido de qualquer forma — é 100% frontend
- Internacionalização do conteúdo

## 6. Restrições

- Stack: React 19 + Vite 7 + Tailwind CSS 4
- Sem bibliotecas novas
- `localStorage` key: `finance_last_seen_version` (não conflitar com keys existentes)
- CHANGELOG.md deve manter compatibilidade humana (legível no GitHub também)

## 7. Premissas e riscos

- **Premissa**: o parser do CHANGELOG extrai a seção `## [versão]` pela correspondência exata com a versão do `package.json`
- **Risco**: se o CHANGELOG não tiver seção para a versão atual, o modal não deve exibir — deve silenciar graciosamente
- **Risco**: `localStorage` pode ser limpo pelo usuário — nesse caso o modal reexibe, o que é comportamento aceitável

## 8. Hipóteses descartadas no Discovery

- JSON separado por versão: descartado — o CHANGELOG.md já existe e é a fonte de verdade; duplicar em JSON cria manutenção desnecessária
- Endpoint de backend com release notes: descartado — é dado estático de frontend, não precisa de API

## 9. Esquema de versionamento adotado

| Versão | Ciclo | Conteúdo |
|---|---|---|
| 0.1.0 | Ciclo 1 | Segurança e governança mínima |
| 0.2.0 | Ciclo 2 | JWT HttpOnly, testes, acessibilidade, docker |
| 0.3.0 | Ciclo 3 | Parcelamento inteligente com numeração automática |
| 0.4.0 | Ciclo 4 | Versionamento e release notes automáticas |

## 10. Próximo passo recomendado

🎯 **Acionar 🏛️ Architect** com este prompt:

> "Leia o briefing em `docs/briefings/release-notes-versioning-ciclo-4.md`. Crie spec, plan e tasks para implementar versionamento e release notes automáticas no projeto Finance (React 19 + Vite 7 + Tailwind 4). Fluxo: (1) atualizar CHANGELOG.md para headers semver `## [0.X.0]`, (2) bump de versão no `client/package.json` para `0.3.0` → `0.4.0` com esta feature, (3) Vite injeta `VITE_APP_VERSION` via `define` em `vite.config.js`, (4) `CHANGELOG.md` importado como raw string, (5) novo `ReleaseNotesModal.jsx` que detecta versão nova via localStorage key `finance_last_seen_version` e exibe conteúdo parseado da seção atual do CHANGELOG, (6) versão no rodapé do sidebar em `App.jsx`. Sem backend, sem libs novas. Gere spec + plan + tasks."
