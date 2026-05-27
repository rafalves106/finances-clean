# Briefing — Export de Movimentações em CSV
> Capturado em: 2026-05-26
> Por: 🧭 Discovery Agent (com Rafael)
> Status: 🟢 Pronto pra Architect

## 1. Persona
Rafael (e qualquer usuário do app) — pessoa que gerencia as próprias finanças e ocasionalmente precisa compartilhar os dados com agentes externos (IA, especialista financeiro) ou analisá-los historicamente.

## 2. Dor real
Para obter os dados de movimentação, o usuário acessa diretamente o banco de dados e exporta a tabela manualmente. Usuários não-técnicos simplesmente não conseguem fazer isso — a informação existe no sistema mas está inacessível pela interface.

## 3. Valor entregue
O usuário consegue baixar um CSV com suas movimentações de qualquer período diretamente do app, sem precisar de acesso técnico ao banco de dados.

## 4. Critério de sucesso (KPIs)
- Usuário exporta sem tocar no banco de dados
- CSV abre corretamente no Excel e Google Sheets sem ajuste manual
- CSV pode ser colado num agente de IA externo (ChatGPT, Claude) sem limpeza

## 5. Escopo

**Dentro:**
- Seleção de período por data início / data fim
- Download de arquivo `.csv` via browser
- Campos: Data, Título, Tipo (Receita/Despesa), Categoria, Valor, Veículo vinculado (se houver)
- Dados filtrados pelo usuário autenticado (isolamento por sessão)
- Ponto de entrada na tela de movimentações (dashboard)

**Fora (explicitamente):**
- Geração de PDF
- Totais ou resumos embutidos no CSV
- Gráficos ou visualizações
- Agendamento automático de export
- Export de outros módulos (investimentos, metas, veículos)
- Filtros adicionais além do período (categoria, tipo)

## 6. Restrições
- Nenhuma biblioteca pesada de terceiros (sem iTextSharp, PDFsharp ou similar)
- Gerado no backend e enviado como file download (não gerado no frontend)
- Sem prazo definido

## 7. Premissas e riscos de produto
- Premissa: o usuário sabe qual período quer exportar — não precisa de sugestão inteligente de intervalo; como validar: comportamento óbvio para qualquer usuário que já usou "relatório de extrato"
- Risco: período muito longo pode gerar arquivo pesado — mitigação: Architect define limite máximo razoável (ex: 12 meses) ou streaming

## 8. Hipóteses descartadas no Discovery
- PDF: complexidade de implementação alta, valor marginal — CSV cobre 3 dos 4 casos de uso identificados
- Filtros por categoria/tipo: aumenta escopo sem resolver a dor principal; pode ser Ciclo 6 se houver demanda

## 9. Próximo passo recomendado
🎯 **Acionar 🏛️ Architect** com este prompt:

> Leia o briefing em `docs/briefings/export-movimentacoes-csv.md` e execute `/speckit.specify` para esta feature. Stack: backend .NET 10 Clean Architecture (Core/Infrastructure/API) + EF Core + PostgreSQL. Frontend React 19 + Vite. O endpoint deve retornar o arquivo CSV como download. Siga as convenções já estabelecidas no projeto.
