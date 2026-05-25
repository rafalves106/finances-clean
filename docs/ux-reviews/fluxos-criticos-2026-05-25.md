# UX Review — Fluxos Críticos (Login, Dashboard, Investimentos, Metas, Veículos)

> Por: 🎨 UI/UX Agent
> Data: 2026-05-25
> Escopo: client/src/App.jsx; client/src/components/LoginView.jsx; client/src/components/DashboardView.jsx; client/src/components/InvestmentsView.jsx; client/src/components/WishListView.jsx; client/src/components/VehicleView.jsx; client/src/components/TransactionModal.jsx; client/src/components/CategoryManagerModal.jsx; client/index.html
> Persona alvo: Rafael (dev/PO/usuário), uso diário para decisões financeiras rápidas

---

## 🎯 Veredicto

**❌ ALTERAÇÕES NECESSÁRIAS**

- 🔴 Bloqueantes (acessibilidade/jornada quebrada): 5
- 🟠 Altos (heurística violada com impacto real): 6
- 🟡 Médios (consistência/polish): 6
- 🟢 Sugestões: 4

---

## A. Heurísticas de Nielsen

| #   | Heurística                             | Status | Achado (se houver)                                                                                          |
| --- | -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| 1   | Visibilidade do status do sistema      | ⚠️     | Erros em fluxos críticos aparecem como `alert` genérico ou apenas no console, sem estado persistente na UI. |
| 2   | Compatibilidade com o mundo real       | ✅     | Linguagem da UI está majoritariamente em PT-BR e aderente ao domínio financeiro.                            |
| 3   | Controle e liberdade                   | ❌     | Ações destrutivas no dashboard removem item sem confirmação/desfazer. Logout indisponível no mobile.        |
| 4   | Consistência e padrões                 | ⚠️     | Padrões de formulário variam muito (com/sem label, mensagens com estilos diferentes).                       |
| 5   | Prevenção de erros                     | ❌     | Simulador de investimentos quebra com taxa 0; inputs sem validação/feedback claro em várias telas.          |
| 6   | Reconhecer em vez de lembrar           | ⚠️     | Navegação lateral no mobile mostra só ícones (rótulos ocultos), forçando memorização.                       |
| 7   | Flexibilidade e eficiência             | ⚠️     | Não há atalhos/ações rápidas para limpar estado, refazer tentativa ou recuperação de erro.                  |
| 8   | Estética e design minimalista          | ✅     | Interface está visualmente limpa e com hierarquia razoável.                                                 |
| 9   | Ajudar a reconhecer/recuperar de erros | ❌     | Ausência de mensagens de erro contextualizadas e acessíveis em fluxos de CRUD.                              |
| 10  | Ajuda e documentação                   | ⚠️     | Não há ajuda contextual nas ações sensíveis (exclusão, impacto de manutenção/investimento).                 |

---

## B. Acessibilidade (WCAG 2.1 AA)

| Critério                                   | Status | Evidência                                                                                          |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| Imagens com alt                            | ✅     | Não há `<img>` relevantes nos fluxos auditados.                                                    |
| Botões com label acessível                 | ❌     | Botões só com ícone sem `aria-label` em Dashboard/Investimentos/Veículos/Categorias/Modal.         |
| Contraste texto normal ≥ 4.5:1             | ❌     | Uso recorrente de `text-slate-300/400` em fundo claro (ex.: textos secundários e ícones).          |
| Contraste texto grande ≥ 3:1               | ⚠️     | Alguns títulos e badges parecem adequados, mas há combinações limítrofes em estado inativo.        |
| Foco visível em todos elementos            | ⚠️     | Inputs de login têm foco explícito; grande parte dos botões não possui estilo de foco consistente. |
| Navegação por teclado completa             | ❌     | Modais sem `role="dialog"`, sem trap de foco e sem comportamento de ESC.                           |
| Hierarquia de heading correta (h1→h2→h3)   | ✅     | Estrutura geral coerente entre App e views.                                                        |
| `lang` no HTML root                        | ❌     | `lang="en"` com produto em PT-BR.                                                                  |
| Forms com labels associadas                | ❌     | Vários inputs sem `label` associada (`htmlFor`/`id`) e dependência de placeholder.                 |
| Mensagens de erro acessíveis (`aria-live`) | ❌     | Erros em login/CRUD sem região viva; muitos fluxos dependem de `alert` e console.                  |
| Touch targets ≥ 44x44px (mobile)           | ❌     | Ícones de ação com `p-1` ou botões compactos abaixo do mínimo recomendado.                         |
| Sem dependência só de cor pra informação   | ⚠️     | Alguns estados têm texto + cor, mas ações em ícones usam cor como principal affordance.            |

---

## C. Design System

- Tokens usados consistentemente? ⚠️ Há base de cores e radius consistente, porém contraste e tamanhos de alvo variam bastante.
- Componentes reutilizados? ⚠️ Existe reuso de `TransactionModal`, mas formulários seguem padrões diferentes de acessibilidade.
- Espaçamentos seguem escala? ✅ Em geral sim (4/6/8/10).
- Tipografia segue escala? ✅ Coerente no macro.
- Variantes documentadas? ❌ Não há documentação de variantes/estados acessíveis.

---

## D. Estados tratados

| Estado                 | Coberto? | Como?                                                                    |
| ---------------------- | -------- | ------------------------------------------------------------------------ |
| Loading                | ✅       | Loading explícito no dashboard e histórico de veículos.                  |
| Erro                   | ⚠️       | Parcial: login mostra erro; vários fluxos só console/alert.              |
| Vazio (empty state)    | ✅       | Investimentos e veículos têm empty state com orientação.                 |
| Sucesso                | ⚠️       | Sucesso implícito por atualização da lista, sem feedback confirmatório.  |
| Sem permissão          | ⚠️       | Tratamento 401 no `App`, porém sem mensagem amigável de sessão expirada. |
| Offline (se aplicável) | ❌       | Não há fallback offline/retry state claro.                               |

---

## E. Achados detalhados

### 🔴 [UX-001] Logout indisponível em mobile

- Arquivo: `client/src/App.jsx:288`
- Evidência: botão Sair fica `hidden md:block`, sem alternativa em telas pequenas.
- Heurística violada: #3 Controle e liberdade
- Risco: usuário não consegue encerrar sessão em mobile.
- Sugestão: expor ação de logout no header mobile (menu ou botão fixo acessível).

### 🔴 [UX-002] Modais sem semântica de diálogo e sem gerenciamento de foco

- Arquivos: `client/src/components/TransactionModal.jsx:164`, `client/src/components/CategoryManagerModal.jsx:96`
- WCAG: 2.1.1 Keyboard, 2.4.3 Focus Order, 4.1.2 Name/Role/Value
- Risco: navegação por teclado pode escapar para conteúdo de fundo e confundir leitor de tela.
- Sugestão: `role="dialog"`, `aria-modal="true"`, foco inicial no título/campo, trap de foco e ESC para fechar.

### 🔴 [UX-003] Inputs sem associação programática de label

- Arquivos: `client/src/components/LoginView.jsx:59`, `client/src/components/InvestmentsView.jsx:257`, `client/src/components/WishListView.jsx:121`, `client/src/components/VehicleView.jsx:432`, `client/src/components/TransactionModal.jsx:185`
- WCAG: 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions
- Risco: leitura assistiva inconsistente e pior taxa de erro em formulário.
- Sugestão: usar `label htmlFor` + `id` único em todos os campos.

### 🔴 [UX-004] Botões de ícone sem nome acessível

- Arquivos: `client/src/components/DashboardView.jsx:751`, `client/src/components/InvestmentsView.jsx:363`, `client/src/components/VehicleView.jsx:634`, `client/src/components/CategoryManagerModal.jsx:127`, `client/src/components/TransactionModal.jsx:174`
- WCAG: 4.1.2 Name, Role, Value
- Risco: leitor de tela anuncia apenas “button”.
- Sugestão: adicionar `aria-label` específico por ação (Editar, Excluir, Fechar modal etc.).

### 🔴 [UX-005] Idioma do documento incorreto para PT-BR

- Arquivo: `client/index.html:2`
- WCAG: 3.1.1 Language of Page
- Risco: pronúncia incorreta em leitores de tela e pior compreensão.
- Sugestão: atualizar para `lang="pt-BR"`.

### 🟠 [UX-006] Exclusão no dashboard sem confirmação/desfazer

- Arquivo: `client/src/components/DashboardView.jsx:765`
- Heurística violada: #5 Prevenção de erros
- Risco: perda acidental de transações.
- Sugestão: confirmação contextual ou toast com “Desfazer” por 5s.

### 🟠 [UX-007] Erros pouco acionáveis (alert/console)

- Arquivos: `client/src/components/DashboardView.jsx:346`, `client/src/components/InvestmentsView.jsx:79`, `client/src/components/VehicleView.jsx:151`
- Heurística violada: #9 Recuperação de erros
- Risco: usuário não entende causa/ação corretiva.
- Sugestão: componente de feedback inline com CTA de recuperação (tentar novamente, revisar campo).

### 🟠 [UX-008] Falha matemática no simulador com taxa zero

- Arquivo: `client/src/components/InvestmentsView.jsx:33`
- Heurística violada: #5 Prevenção de erros
- Risco: resultado `Infinity/NaN`, quebrando confiança do usuário.
- Sugestão: branch específico para taxa 0 e validação de faixa.

### 🟠 [UX-009] Navegação lateral mobile baseada só em ícones

- Arquivo: `client/src/App.jsx:283`
- Heurística violada: #6 Reconhecer > lembrar
- Risco: alta carga cognitiva para descobrir destino de cada aba.
- Sugestão: labels visíveis em mobile (mini-drawer/tooltip persistente).

### 🟠 [UX-010] Alvos de toque pequenos em ações críticas

- Arquivos: `client/src/components/DashboardView.jsx:751`, `client/src/components/InvestmentsView.jsx:363`, `client/src/components/CategoryManagerModal.jsx:127`
- WCAG: 2.5.5 Target Size (AAA, mas recomendado como baseline móvel)
- Risco: erros de toque e ações acidentais.
- Sugestão: elevar área clicável para mínimo ~44x44px.

### 🟠 [UX-011] Fechar modal sem alternativa de teclado explícita

- Arquivos: `client/src/components/TransactionModal.jsx:174`, `client/src/components/CategoryManagerModal.jsx:100`
- WCAG: 2.1.1 Keyboard
- Risco: usuário fica “preso” em cenário sem mouse.
- Sugestão: suportar ESC e botão de fechamento com `aria-label`.

### 🟡 [UX-012] Contraste baixo em textos secundários

- Arquivos: `client/src/components/InvestmentsView.jsx:345`, `client/src/components/VehicleView.jsx:565`, `client/src/components/DashboardView.jsx:815`
- WCAG: 1.4.3 Contrast (Minimum)
- Risco: baixa legibilidade para baixa visão.
- Sugestão: elevar para tons com contraste AA (ex.: `slate-600`+).

### 🟡 [UX-013] Ausência de feedback de sucesso explícito em CRUD

- Arquivos: múltiplos fluxos críticos
- Heurística: #1 Visibilidade do status
- Sugestão: toast de sucesso discreto com contexto da ação.

### 🟡 [UX-014] Formulário de veículo sem campos obrigatórios claros

- Arquivos: `client/src/components/VehicleView.jsx:432`
- Heurística: #5 Prevenção de erros
- Sugestão: `required`, mensagens de validação e máscara para placa.

### 🟡 [UX-015] Tabela de histórico sem `caption` e sem escopo explícito

- Arquivo: `client/src/components/VehicleView.jsx:535`
- WCAG: 1.3.1 Info and Relationships
- Sugestão: adicionar `caption` e `scope="col"` nos cabeçalhos.

### 🟡 [UX-016] Estados de sessão expirada não comunicam ação

- Arquivo: `client/src/App.jsx:136`
- Heurística: #1 e #9
- Sugestão: mensagem “Sessão expirada, faça login novamente” antes de redirecionar.

### 🟡 [UX-017] Ação “Aplicar tudo” em simulação sem confirmação

- Arquivo: `client/src/components/DashboardView.jsx:497`
- Heurística: #5
- Sugestão: confirmação breve com resumo do impacto antes de persistir.

---

## ✅ Pontos positivos

- Boa cobertura de empty states em investimentos e veículos.
- Organização por fluxo crítico clara (Dashboard, Investimentos, Metas, Veículos).
- Linguagem da UI aderente ao domínio do usuário final.
- Reuso de modal de transação entre dashboard e manutenção veicular.

---

## 📋 Melhorias de alto impacto e baixo esforço (7 dias)

1. Corrigir semântica dos modais (`role`, `aria-modal`, trap de foco, ESC, foco inicial/retorno).
2. Adicionar `aria-label` em todos botões de ícone e aumentar target hit area.
3. Associar labels programáticos em formulários críticos (login, nova transação, novo investimento, veículo, metas).
4. Ajustar `lang` para PT-BR e revisar textos de erro com `aria-live="polite"`.
5. Incluir confirmação/desfazer para exclusões e para “Aplicar tudo” na simulação.
6. Corrigir fórmula de juros para taxa 0 e validações mínimas de entrada.
7. Expor logout no mobile e rótulos de navegação mais claros em telas pequenas.

---

## 📏 Métricas para validar melhora de UX

1. Taxa de conclusão do fluxo de login sem erro (meta: +15% em 2 semanas).
2. Tempo mediano para registrar transação (meta: -20%).
3. Taxa de erro em formulários (submit inválido / total submits) por tela crítica (meta: -30%).
4. Incidência de ações destrutivas revertidas/canceladas (proxy de erro evitado) (meta: queda de exclusões acidentais).
5. Sucesso de navegação por teclado no roteiro crítico (login → lançar transação → editar → sair) (meta: 100%).
6. Pontuação Lighthouse Accessibility nas rotas críticas (meta: >= 95).
7. Número de bugs UX reportados por semana nos fluxos críticos (meta: tendência de queda após release).

---

## Checklist resumido (PR)

- [ ] Heurísticas Nielsen: sem violação bloqueante em #3, #5 e #9
- [ ] WCAG AA: labels, nome acessível, foco, teclado e `lang` corrigidos
- [ ] Estados: erro/sucesso com feedback acionável
- [ ] Mobile: logout e navegação compreensível em 375px
- [ ] Fluxos críticos validados com teste manual por teclado
