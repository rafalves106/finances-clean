# Briefing - Reorganizacao do formulario de categorias

> Capturado em: 27/05/2026
> Por: Discovery Agent (com PO)
> Status: Pronto pra Architect

## 1. Persona

Usuario unico operador do sistema (PO), com uso frequente do fluxo de categorias.

## 2. Dor real

No modal de gerenciamento de categorias, o formulario de criacao/edicao fica abaixo da lista recente, dificultando encontrar rapido a acao principal e gerando excesso de scroll.

## 3. Valor entregue

Reduzir tempo para criar/editar categoria e aumentar sensacao de organizacao com fluxo intent driven: primeiro acao, depois historico/lista.

## 4. Criterio de sucesso (KPIs)

- Menos tempo percebido para iniciar criacao de categoria.
- Menos scroll no fluxo de criacao/edicao.
- Menor sensacao de perda no modal durante operacao recorrente.

## 5. Escopo

Dentro:

- Reorganizar o modal para manter o formulario acima da lista de categorias recentes.
- Introduzir botao pilula acima da lista para expandir/recolher o formulario, com estado inicial fechado.
- Ao clicar em editar categoria, abrir automaticamente o formulario no topo e preencher dados da categoria.
- Priorizar velocidade de criacao em mobile sem redesenho amplo.

Fora (explicitamente):

- Alteracoes de regra de negocio, validacoes de dominio ou API.
- Redesign completo do modal.
- Mudancas em outras telas fora do fluxo de gerenciamento de categorias.

## 6. Restricoes

- Manter implementacao pontual no fluxo atual.
- Preservar comportamento funcional existente de criar, editar e deletar.
- Evitar crescimento de escopo para alem de reorganizacao UX.

## 7. Premissas e riscos de produto

- Premissa: colocar formulario no topo reduz atrito e tempo de operacao para usuario frequente.
- Premissa: estado fechado por padrao economiza espaco sem comprometer descoberta da acao.
- Risco: estado fechado pode ocultar CTA para usuarios novos; mitigacao: botao pilula claro e destacado.
- Risco: em edicao, autoexpansao pode causar salto visual; mitigacao: transicao simples e foco no primeiro campo.

## 8. Hipoteses descartadas no Discovery

- Manter formulario abaixo da lista para contexto historico primeiro (descartado por piorar velocidade e aumentar scroll).
- Fazer redesign amplo do modal (descartado por sair do escopo do ciclo).

## 9. Proximo passo recomendado

Acionar Architect com este prompt:

Planeje uma mudanca pontual no modal de gerenciamento de categorias para tornar o fluxo mais intent driven e reduzir scroll.

Contexto:

- Arquivo principal do modal: client/src/components/CategoryManagerModal.jsx
- Gatilho atual: client/src/components/DashboardView.jsx
- Integracao de abertura/fechamento: client/src/App.jsx

Objetivo:

- Colocar o formulario de categoria acima da lista de categorias recentes.
- Adicionar um botao pilula para expandir/recolher o formulario.
- Estado inicial do formulario: fechado.
- Ao clicar em editar numa categoria, o formulario deve abrir automaticamente no topo e carregar os dados para edicao.

Regras:

- Mudanca estritamente de organizacao UX/local de componentes (sem alterar regras de negocio).
- Nao mexer em APIs ou contratos backend.
- Nao fazer redesign amplo do modal.
- Manter acessibilidade basica (foco e labels) e comportamento atual de criar, editar e deletar.

Entregue:

- Proposta objetiva de estrutura do modal.
- Passos de implementacao por arquivo.
- Riscos e mitigacoes.
- Checklist de validacao manual (desktop e mobile).
