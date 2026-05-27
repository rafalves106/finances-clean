# Briefing — Orçamento por Categoria com Alertas Visuais
> Capturado em: 2026-05-26
> Por: 🧭 Discovery Agent (com Rafael)
> Status: 🟢 Pronto pra Architect

## 1. Persona
Rafael — gerencia as próprias finanças e quer controle ativo sobre os gastos por categoria, não apenas registro passivo do que foi gasto.

## 2. Dor real
Hoje não é possível definir um limite de gasto por categoria. O usuário gasta sem saber se está perto ou já ultrapassou o teto que se impôs, e só descobre consultando manualmente os totais.

## 3. Valor entregue
O usuário define um teto mensal por categoria e recebe sinais visuais claros quando está se aproximando (80%) ou já ultrapassou (100%+) o limite — tanto na visualização de categorias quanto num indicador visível no dashboard.

## 4. Critério de sucesso (KPIs)
- Usuário consegue definir e editar um orçamento mensal por categoria
- A barra de progresso da categoria muda de cor em dois estágios: atenção (≥80%) e ultrapassado (≥100%)
- Um badge ou indicador no dashboard sinaliza categorias em alerta sem precisar abrir o card de categorias

## 5. Escopo

**Dentro:**
- Definir valor de orçamento mensal por categoria (opcional — categoria sem orçamento não exibe alerta)
- Barra de progresso na aba "Mês atual": amarela quando ≥80% do orçamento, vermelha quando ≥100%
- Indicador/badge no dashboard (ex: no card de Categorias ou no título) mostrando quantas categorias estão em alerta
- Orçamento mensal fixo (mesmo valor todo mês)
- Gerenciamento do orçamento integrado ao gerenciador de categorias já existente

**Fora (explicitamente):**
- Orçamento global (total de todas as categorias)
- Orçamento variável por mês (valores diferentes em Jan, Fev, etc.)
- Push notifications ou alertas por email/SMS
- Alertas para receitas (somente despesas)
- Subcategorias ou agrupamentos customizados

## 6. Restrições
- Sem nova tela — o gerenciamento do orçamento entra no modal de categorias já existente
- Orçamento é opcional por categoria (não quebra categorias sem orçamento)
- Sem nova lib de UI necessária

## 7. Premissas e riscos de produto
- Premissa: o usuário sabe quanto quer gastar por categoria — não precisa de sugestão automática de orçamento; fácil de validar pela experiência diária
- Risco: usuário define orçamentos muito baixos e vê tudo sempre em vermelho, gerando "fadiga de alerta" — mitigação: não há, é responsabilidade do usuário; o app não impede

## 8. Hipóteses descartadas no Discovery
- Orçamento total (sem divisão por categoria): descartado — a dor é específica por categoria
- Apenas visual na barra (sem badge): descartado — usuário quer visibilidade sem precisar abrir o card

## 9. Próximo passo recomendado
🎯 **Acionar 🏛️ Architect** com este prompt:

> Leia o briefing em `docs/briefings/orcamento-por-categoria.md` e execute `/speckit.specify` para esta feature. Stack: backend .NET 10 Clean Architecture (Core/Infrastructure/API) + EF Core + PostgreSQL. Frontend React 19 + Vite + Tailwind. O gerenciamento do orçamento deve ser integrado ao modal de categorias já existente (`CategoryManagerModal.jsx`). Siga as convenções já estabelecidas no projeto.
