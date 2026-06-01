# Briefing - Cartao visualizador sem integracao bancaria

> Capturado em: 01/06/2026
> Por: Discovery Agent (com PO)
> Status: Pronto pra Architect

## 1. Persona

PO e usuario unico atual do app, construindo o fluxo para futuros usuarios.

## 2. Dor real

Hoje o usuario precisa abrir o app do banco para consultar limite, vencimento e previsibilidade de gastos no cartao, gerando retrabalho manual e fragmentacao da visao financeira.

## 3. Valor entregue

Centralizar organizacao do cartao dentro do app financeiro com foco em previsibilidade de gastos, consulta de limite e agrupamento de contas, sem depender de integracao com banco.

## 4. Criterio de sucesso (KPIs)

- Reducao de trabalho manual para controle de cartao.
- Usuario consegue consultar limite, vencimento e panorama de gastos no proprio app.
- Fluxo cobre o objetivo principal de organizacao e previsibilidade do cartao.

## 5. Escopo

Dentro:

- Criar um modulo de cartao como visualizador interno (nao bancario).
- Permitir cadastro manual de dados basicos do cartao: nome, limite total, dia de vencimento e dia de fechamento.
- Exibir limite utilizado, limite disponivel e percentual de uso no periodo atual.
- Agrupar lancamentos de cartao no app para previsibilidade de fatura.
- Exibir previsao de fatura atual e proxima com base nos lancamentos cadastrados.

Fora (explicitamente):

- Integracao bancaria/open finance.
- Captura de dados sensiveis reais de cartao (numero completo, CVV, tokenizacao bancaria).
- Processamento de pagamento.

## 6. Restricoes

- Prazo maximo de 7 dias para MVP.
- Solucao deve ser apenas visualizador e organizador interno.
- Evitar escopo de compliance pesado (PCI), pois nao havera dados sensiveis reais.

## 7. Premissas e riscos de produto

- Premissa: visualizacao consolidada no app reduz necessidade de consulta ao app do banco.
- Premissa: lancamento manual e suficiente para entregar valor inicial.
- Risco: usuario esquecer de cadastrar compras; mitigacao: UX simples para lancamento rapido e estado vazio guiado.
- Risco: expectativa de sincronizacao automatica com banco; mitigacao: comunicar claramente que o modulo e manual nesta fase.

## 8. Hipoteses descartadas no Discovery

- Integracao bancaria no MVP (descartada por escopo, prazo e complexidade).
- Projeto com dados sensiveis de cartao (descartado por nao ser necessario para valor inicial).

## 9. Proximo passo recomendado

Acionar Architect com este prompt:

Temos um briefing aprovado para implementar modulo de cartao como visualizador interno, sem integracao bancaria. Use [docs/briefings/cartao-visualizador-sem-integracao.md](docs/briefings/cartao-visualizador-sem-integracao.md) como fonte principal e siga o fluxo completo Spec Kit:

1. Gerar spec (`/speckit.specify`) para MVP de 7 dias com foco em:

- cadastro manual de cartao (limite, fechamento, vencimento),
- visao de limite usado/disponivel,
- previsao de fatura atual/proxima,
- agrupamento de lancamentos de cartao,
- UX clara de fluxo manual (sem banco).

2. Gerar plan (`/speckit.plan`) com:

- arquitetura e mudancas por arquivo no frontend e backend (se necessario),
- estrategia de migracao de dados,
- riscos e mitigacoes,
- sequencia incremental para entregar em 7 dias.

3. Gerar tasks (`/speckit.tasks`) com granularidade executavel e quality gates.

Restricoes obrigatorias:

- sem integracao bancaria,
- sem armazenar dados sensiveis reais de cartao,
- sem ampliar para pagamento/processamento.

Entregar no final:

- links de spec/plan/tasks,
- checklist manual de validacao,
- criterio go/no-go do MVP.
