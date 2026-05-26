# Briefing — Parcelamento Inteligente com Numeração Automática (Ciclo 3)

> Capturado em: 25 de maio de 2026
> Por: 🧭 Discovery Agent (com Rafael)
> Status: 🟢 Pronto pra Architect

## 1. Persona

Rafael (único dev, PO e usuário). Usa o app diariamente para controle financeiro pessoal no desktop. Cadastra compras parceladas com frequência.

## 2. Dor real

Quando Rafael cria uma compra parcelada (ex: "Bateria CC" em 12x), o app cria as 12 transações corretamente — mas todas com o mesmo título. Para identificar qual é a parcela 2 de 12, Rafael precisa editar manualmente cada transação e acrescentar o número. Isso é trabalhoso e propenso a esquecimento.

Além disso, o modelo atual não distingue "parcelado" (compra com fim definido) de "recorrente fixo" (conta mensal sem fim definido como aluguel). Ambos usam `Fixa = true` com `Periodo = N`, mas têm semânticas e comportamentos esperados diferentes.

## 3. Valor entregue

Ao criar uma compra parcelada, as N transações são geradas automaticamente com `{título} 1/N`, `{título} 2/N`, ... `{título} N/N`. Rafael abre o dashboard e sabe imediatamente qual parcela é qual, sem nenhuma edição manual. As recorrentes fixas (aluguel, salário) continuam sem numeração.

## 4. Critério de sucesso (KPIs)

- Ao criar movimentação do tipo **Parcelada**: todas as N transações geradas têm o sufixo `{i}/{N}` no título automaticamente
- Ao criar movimentação do tipo **Recorrente Fixa**: comportamento atual preservado, sem numeração
- Frontend distingue visualmente os dois tipos na criação
- Retroativo: é possível renumerar grupos existentes sem tipo definido
- `npm test` e `dotnet test` continuam passando

## 5. Escopo

**Dentro:**
- Novo campo de domínio: `TipoMovimentacaoFixa` (enum: `Parcelada | RecorrenteFixa`)
- Migration para adicionar o campo (default: `RecorrenteFixa` para dados existentes)
- `CriarMovimentacaoUseCase`: gerar `{titulo} {i+1}/{N}` para tipo `Parcelada`
- Frontend: modal de criação de movimentação exibe toggle/radio "Parcelada / Recorrente Fixa" quando `Fixa = true`
- Endpoint de renumeração retroativa: dado um `grupoRecorrenciaId`, renumera as transações do grupo em ordem cronológica
- Frontend: opção de renumerar grupo existente (trigger no detalhe do grupo ou modal)

**Fora (explicitamente):**
- Recorrência verdadeiramente infinita (sem `Periodo` definido) — próximo ciclo se houver demanda
- Valores diferentes por parcela (ex: parcela com juros variável)
- Importação de extrato bancário
- Projeção de saldo mensal (Dor B1 — ciclo separado)

## 6. Restrições

- Backend: .NET 10, Clean Architecture — mudança só em Core + Infrastructure (migration + repositório)
- Frontend: React 19 + Tailwind CSS 4 — apenas `TransactionModal.jsx` e listagem de movimentações
- Sem breaking change na API para clientes existentes (campo novo com default)
- Dados de produção: migration deve ter default seguro (`RecorrenteFixa`) para não quebrar histórico

## 7. Premissas e riscos

- **Premissa**: todos os dados existentes com `Fixa = true` serão tratados como `RecorrenteFixa` por padrão — Rafael precisará renumerar manualmente os grupos que são parcelamentos retroativos via UI
- **Risco**: o título original de transações retroativas pode já ter sufixo manual parcial (ex: "Bateria 2/12") — a função de renumeração deve normalizar o título base removendo sufixo `\d+/\d+` antes de reaplicar
- **Risco**: migration em produção precisa ser testada com `dotnet ef migrations script` antes do deploy

## 8. Hipóteses descartadas no Discovery

- Editar títulos retroativamente de forma automática sem UI: descartado — Rafael precisa confirmar quais grupos são parcelamentos (não é possível inferir com certeza dos dados atuais)
- Distinguir parcelado vs recorrente por `Periodo` (ex: > 24 = recorrente): descartado — a semântica é intenção do usuário, não derivada do número

## 9. Contexto técnico relevante (para o Architect)

**Modelo atual:**
- `Movimentacao.Fixa` (bool) + `Movimentacao.Periodo` (int) + `Movimentacao.GrupoRecorrenciaId` (Guid?)
- `TipoRecorrencia` enum: `Mensal | Semanal` (cadência, não tipo de fixação)
- `CriarMovimentacaoUseCase`: loop de `i = 0` até `Periodo`, clona com nova data via `ClonarComNovaData` — título copiado sem alteração

**O que precisa mudar:**
- Adicionar `TipoMovimentacaoFixa` enum ao domínio
- Ajustar `CriarMovimentacaoUseCase` para injetar numeração no título quando `Parcelada`
- Migration com default `RecorrenteFixa`
- Novo use case ou endpoint: `RenumerarGrupoUseCase(grupoRecorrenciaId)`

## 10. Próximo passo recomendado

🎯 **Acionar 🏛️ Architect** com este prompt:

> "Leia o briefing em `docs/briefings/parcelamento-inteligente-ciclo-3.md`. Crie spec, plan e tasks para implementar o Parcelamento Inteligente com numeração automática no projeto Finance (.NET 10 + React 19). O modelo atual está descrito na seção 9 do briefing. A mudança principal é: (1) novo enum `TipoMovimentacaoFixa` no domínio, (2) `CriarMovimentacaoUseCase` gera sufixo `{i+1}/{N}` no título para tipo `Parcelada`, (3) migration com default `RecorrenteFixa`, (4) `RenumerarGrupoUseCase` para retroativo, (5) frontend: `TransactionModal.jsx` exibe toggle Parcelada/Recorrente Fixa, (6) frontend: UI para renumerar grupo existente. Gere spec + plan + tasks com ordem de execução, incluindo migration e testes."
