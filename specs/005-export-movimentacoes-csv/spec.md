# Feature Specification: Export de Movimentacoes em CSV

**Feature Branch**: `005-export-movimentacoes-csv`
**Created**: 2026-05-26
**Status**: Draft
**Input**: `docs/briefings/export-movimentacoes-csv.md`

## §0 Contexto de Negócio

- **Persona**: Rafael (e usuarios do app que nao acessam banco diretamente).
- **Dor real**: hoje a extração exige acesso tecnico ao banco, inviabilizando uso por perfis nao-tecnicos.
- **Valor entregue**: exportacao de movimentacoes por periodo em CSV direto pela interface, com download no navegador.
- **KPIs de sucesso**:
  - usuario exporta sem tocar no banco.
  - CSV abre no Excel/Google Sheets sem ajuste manual.
  - CSV pode ser reaproveitado em analise externa/IA sem limpeza adicional.
- **Restricoes**:
  - backend gera o arquivo e endpoint retorna como download.
  - sem libs pesadas de terceiros.
  - escopo limitado a movimentacoes e filtro por periodo (data inicio/fim).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Exportar CSV por periodo no dashboard (Priority: P1)

Como usuario autenticado, quero selecionar data inicio e data fim no modulo de movimentacoes e baixar um arquivo CSV imediatamente.

**Why this priority**: resolve a dor principal de acessibilidade dos dados sem acesso tecnico ao banco.

**Independent Test**: em sessao autenticada, informar periodo valido na tela de movimentacoes e confirmar que o browser inicia download de arquivo `.csv`.

**Acceptance Scenarios**:

1. **Given** usuario autenticado e periodo valido, **When** aciona exportacao, **Then** API retorna arquivo CSV com cabecalho e linhas do periodo e navegador inicia download.
2. **Given** usuario autenticado sem dados no periodo, **When** exporta, **Then** download ocorre com cabecalho CSV e zero linhas de dados.

---

### User Story 2 - Isolamento por usuario autenticado (Priority: P1)

Como usuario, quero que o CSV contenha somente minhas movimentacoes, respeitando isolamento da sessao atual.

**Why this priority**: evita vazamento de dados financeiros entre contas, requisito de seguranca basico.

**Independent Test**: com duas contas diferentes e mesmo periodo, cada conta recebe CSV com seu proprio conjunto de dados.

**Acceptance Scenarios**:

1. **Given** usuario A autenticado, **When** exporta o periodo, **Then** o arquivo nao contem movimentacoes de usuario B.
2. **Given** requisicao sem autenticacao, **When** tenta exportar, **Then** operacao e bloqueada conforme politica de auth existente.

---

### User Story 3 - Compatibilidade de consumo em planilhas (Priority: P2)

Como usuario, quero que o arquivo tenha colunas consistentes para abrir corretamente em planilhas e leitura externa.

**Why this priority**: garante utilidade pratica do export para analise e compartilhamento.

**Independent Test**: abrir arquivo exportado em Excel e Google Sheets, verificando separacao de colunas e legibilidade dos campos.

**Acceptance Scenarios**:

1. **Given** CSV gerado, **When** aberto em planilha, **Then** colunas `Data`, `Titulo`, `Tipo`, `Categoria`, `Valor`, `Veiculo` sao reconhecidas.
2. **Given** movimentacao sem categoria/veiculo, **When** exportada, **Then** campos opcionais ficam vazios sem quebrar estrutura do CSV.

## Edge Cases

- Data inicio maior que data fim deve retornar erro de validacao na fronteira da API.
- Periodo sem registros deve retornar arquivo valido com cabecalho.
- Titulos/descricoes com virgula, aspas ou quebra de linha devem ser escapados corretamente no CSV.
- Valores monetarios devem sair em formato consistente para planilha (sem perda de precisao).
- [NEEDS CLARIFICATION] limite maximo de janela de exportacao (ex.: 12 meses) para reduzir risco de arquivos muito grandes.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 [API Download]**: sistema MUST expor endpoint autenticado no contexto de movimentacoes que retorne `text/csv` como download de arquivo.
- **FR-002 [Filtro Periodo]**: endpoint MUST receber `dataInicio` e `dataFim` como parametros obrigatorios para filtrar registros.
- **FR-003 [Escopo de Dados]**: CSV MUST conter apenas movimentacoes do usuario autenticado no periodo solicitado.
- **FR-004 [Colunas]**: CSV MUST conter as colunas `Data`, `Titulo`, `Tipo`, `Categoria`, `Valor`, `Veiculo` nesta ordem.
- **FR-005 [Tipo Legivel]**: coluna `Tipo` MUST usar rotulos legiveis para negocio (`Receita`/`Despesa`), nao enums tecnicos internos.
- **FR-006 [Campos Opcionais]**: `Categoria` e `Veiculo` MUST permitir valor vazio quando nao houver vinculo.
- **FR-007 [Encoding e Escape]**: conteudo CSV MUST aplicar escape adequado para delimitadores/aspas/quebras de linha e ser compativel com Excel/Google Sheets.
- **FR-008 [Sem Resumos]**: exportacao MUST incluir apenas linhas de movimentacao, sem totais agregados ou secoes extras.
- **FR-009 [UI Entry Point]**: frontend MUST disponibilizar acao de exportacao por periodo na tela de movimentacoes (dashboard).
- **FR-010 [Sem Backend Extra Scope]**: implementacao MUST permanecer sem export de outros modulos (investimentos, metas, veiculos) neste ciclo.
- **FR-011 [Range Guard]**: sistema MUST tratar periodo invalido (`dataInicio > dataFim`) com resposta de erro clara.
- **FR-012 [Performance Guard]**: sistema MUST aplicar politica de janela maxima de exportacao ou estrategia equivalente para evitar arquivo excessivo [NEEDS CLARIFICATION: limite exato].

### Constitution Alignment _(mandatory)_

- **CA-001 (Princípio I - Bounded Architecture)**: regra de selecao de dados no Core/UseCase, persistencia/consulta no Infrastructure, entrega de arquivo no API Controller, gatilho no client.
- **CA-002 (Princípio II - Security by Default)**: endpoint sob autenticacao existente e isolamento por usuario; sem exposicao de dados de terceiros em payload/log.
- **CA-003 (Princípio III - Quality Gates Executáveis)**: alteracoes MUST validar `dotnet build`, `dotnet test`, `cd client && npm run lint`, `cd client && npm run build`, `cd client && npm test`.
- **CA-004 (Princípio IV - Data Integrity)**: valores monetarios exportados sem perda de precisao e datas em formato deterministico no arquivo.
- **CA-005 (Princípio V - Operability)**: falhas de validacao/export devem retornar mensagens acionaveis e status HTTP coerente sem PII.

### Key Entities _(include if feature involves data)_

- **FiltroExportacaoMovimentacoes**: intervalo de datas (`DataInicio`, `DataFim`) informado pelo usuario.
- **LinhaCsvMovimentacao**: projecao de uma movimentacao para export (`Data`, `Titulo`, `Tipo`, `Categoria`, `Valor`, `Veiculo`).
- **ArquivoCsvMovimentacoes**: artefato final entregue como download HTTP para o navegador.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos usuarios autenticados conseguem baixar CSV por periodo sem acesso ao banco.
- **SC-002**: 100% dos arquivos exportados no escopo de teste abrem em Excel e Google Sheets com colunas corretas.
- **SC-003**: 0 ocorrencias de dados de outro usuario no CSV em testes de isolamento de conta.
- **SC-004**: 100% das requisicoes com periodo invalido retornam erro de validacao previsivel.
- **SC-005**: quality gates do escopo alterado passam sem regressao.

## Assumptions

- O endpoint sera adicionado em `api/v1/movimentacoes` para manter coesao com o contexto de dominio existente.
- O frontend reutilizara o estado de periodo ja presente no dashboard para preencher `dataInicio` e `dataFim`.
- O formato de data no CSV sera deterministico e legivel para consumo humano.
- Nao havera paginacao no CSV deste ciclo; todo periodo valido retorna em um unico arquivo.

## Open Clarification Log

- **CL-001**: Definir limite maximo oficial para janela de exportacao (ex.: 12 meses) antes da implementacao.
- **CL-002**: Definir convencao final de delimitador CSV (`;` ou `,`) para maximizar compatibilidade local (pt-BR) versus interoperabilidade geral.
