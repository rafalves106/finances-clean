# Mapeamento — Importação de fatura de cartão em PDF

> Capturado em: 01/08/2026
> Escopo: exploração/proposta. Nenhum código de aplicação foi alterado neste documento.
> Persona: Rafael — único dev, PO e usuário do app.
> Pedido de origem: "upload de PDF da fatura do cartão → gera `Movimentacao` automaticamente, em vez de digitar cada lançamento".

---

## 1. Estado atual (o que já existe e o que a feature precisa reaproveitar)

### 1.1 `Movimentacao` e o vínculo com cartão

- `Movimentacao` é abstrata, com `Entrada`/`Saida` concretas (`server/Core/Domain/Movimentacao/Movimentacao.cs:3-49`, `Entrada.cs`, `Saida.cs`). Campos relevantes para import: `CartaoId` (Guid?), `CompetenciaFatura` (int?, formato `AAAAMM`), `Titulo`, `Valor` (`decimal`, valida `> 0`), `Data`, `CategoriaId`.
- O construtor valida `valor <= 0` e `titulo` vazio lançando `ArgumentException` (`Movimentacao.cs:26-30`) — qualquer linha de fatura mal-extraída (valor zerado, título vazio) já quebra na criação, o que é bom: a validação de domínio existente já é a primeira linha de defesa contra parsing ruim.
- `Movimentacao` não tem construtor público direto — é criada via `new Entrada(...)`/`new Saida(...)` dentro do controller (ver 1.3), não por um DTO genérico. Isso importa para o desenho do novo use case.

### 1.2 `CartaoManual` e cálculo de competência

- `CartaoManual` (`server/Core/Domain/Cartao/CartaoManual.cs:3-116`): `Nome` (string livre, até 100 chars, sem enum de banco/bandeira), `LimiteTotal`, `DiaFechamento`, `DiaVencimento`, `CorTema`, `Ativo`. **Não existe campo de "banco/emissor"** — `Nome` é texto livre digitado pelo usuário no cadastro (ex.: poderia ser "Nubank Roxo" ou só "Cartão 1", não há como saber sem consultar os dados reais do usuário).
- Máximo de **3 cartões ativos por usuário**, regra hard-coded em `CadastrarCartaoManualUseCase.cs:8` (`LimiteMaximoCartoesAtivos = 3`).
- `CompetenciaFaturaCalculator.CalcularCompetencia(dataReferenciaUtc, diaFechamento)` (`server/Core/Domain/Cartao/CompetenciaFaturaCalculator.cs:5-23`) resolve a competência (`AAAAMM`) de uma compra a partir da data e do dia de fechamento do cartão, inclusive quando o fechamento cruza o mês (dia 29 fechamento, compra dia 29 já cai na próxima fatura — regra `data.Day >= fechamentoNoMes`). **Este é o método que a importação precisa reusar** para atribuir `CompetenciaFatura` a cada linha extraída, em vez de confiar na competência impressa no PDF (que pode ter nomenclatura própria por banco).
- No controller, a competência de uma nova compra só é calculada quando `dto.CartaoId != null && dto.Tipo == Saida` (`MovimentacoesController.cs:328-336`, `ObterCompetenciaFaturaNovaCompra`) — o import deve seguir exatamente essa regra, já que toda linha de fatura é, por definição, uma `Saida` vinculada a um `CartaoId`.

### 1.3 Precedente de criação e exportação — o padrão de código a seguir

- `CriarMovimentacaoUseCase.Executar(Movimentacao movimentacao)` (`server/Core/UseCases/Movimentacao/CriarMovimentacaoUseCase.cs:8-37`) recebe uma entidade **já construída**, não um DTO. Quem monta `Entrada`/`Saida` a partir do `MovimentacaoDTO` é o controller (`MovimentacoesController.cs:26-61`). Isso significa que o novo use case de confirmação de import não pode simplesmente "chamar `CriarMovimentacaoUseCase` com uma lista de DTOs" — precisa replicar a mesma montagem de `Saida` que o controller já faz, idealmente extraindo esse trecho para um helper compartilhado (hoje é lógica duplicada em `CriarMovimentacao` e `AtualizarMovimentacao`).
- `MovimentacaoDTO` (`server/Core/Application/DTOs/Movimentacao/MovimentacaoDTO.cs:5-21`) é o formato de contrato usado hoje entre frontend e backend — serve de referência de forma para o DTO do item confirmado do import.
- `ExportarMovimentacoesCsvUseCase` (`server/Core/UseCases/Movimentacao/ExportarMovimentacoesCsvUseCase.cs`) é o único precedente de "geração de arquivo" no backend hoje — mas é o sentido oposto (export, não import) e não há **nenhum** upload de arquivo em lugar nenhum do projeto: `grep` por `IFormFile`/`multipart/form-data`/`FormData(` no repo inteiro (server + client) não retornou nenhuma ocorrência. A importação de fatura seria o **primeiro fluxo de upload de arquivo do app** — não há endpoint, limite de tamanho de request, nem tratamento de `multipart/form-data` configurado em `Program.cs` hoje.

### 1.4 Frontend — onde a affordance de import encaixa

- `client/src/components/dashboard/CardsSlide.jsx` é o componente que já renderiza cada cartão ativo em coluna própria, com nome, uso de limite, fechamento/vencimento e um botão "Editar Cartão" fixo no rodapé de cada coluna (`CardsSlide.jsx:256-266`). Um botão "Importar Fatura" ao lado de "Editar Cartão", dentro do mesmo `<article>` por cartão (`CardsSlide.jsx:122-267`), é o encaixe natural — já existe o contexto do `card.id` e do `card.nome` ali, sem precisar de navegação nova.
- `client/src/services/api.js` segue o padrão `export const API_X_URL = ...` por recurso (`api.js:17-24`); o novo endpoint seguiria `API_CARTAO_URL` mais um sub-path, ex. `${API_CARTAO_URL}/{id}/importar-fatura`.
- Não existe hoje nenhum componente de upload de arquivo (`<input type="file">`) em nenhum lugar do client — outro sinal de que isso é greenfield na camada de UI, não uma extensão de um padrão existente.

### 1.5 Quais bancos o Rafael realmente usa — não há evidência no código

- Busquei por nomes de banco/emissor conhecidos (Nubank, Inter, Itaú, Bradesco, Santander, C6, Caixa, Neon, PicPay, etc.) em `.cs`, `.json`, `.md`, `.jsx`, `.js` do repositório inteiro (excluindo `node_modules`) e **não há nenhuma ocorrência** — nem em testes, nem em seeds, nem no `CHANGELOG.md`, nem em specs. `CartaoManual.Nome` é texto livre e os testes de integração usam nomes genéricos ("Cartão Atualizado", `CartaoUseCasesTests.cs:114`).
- **Conclusão prática**: a premissa "esse usuário só tem 2-3 bancos, então dá pra fazer um parser por banco" está correta em espírito (é um app de uma pessoa só, com no máximo 3 cartões ativos por regra de domínio), mas **quais bancos são esses precisa ser perguntado ao Rafael diretamente antes de escrever qualquer parser** — não dá para adivinhar do código. Este documento propõe a arquitetura (parser por template de emissor), não os templates em si.

---

## 2. Bibliotecas de extração de texto de PDF em .NET 10

Avaliadas para uso em um projeto pessoal, fechado, rodando em Docker/Linux (ver `server/Dockerfile`), sem orçamento para licença paga:

| Biblioteca | Licença | Nativo? | Avaliação |
|---|---|---|---|
| **PdfPig** (`UglyToad.PdfPig`) | MIT | Não — 100% gerenciado (C#) | **Recomendado.** Extração de texto com coordenadas (X/Y) por palavra/glifo, permite reconstruir linhas por clustering de posição — exatamente o que uma tabela de fatura sem marcação estrutural exige. Sem dependência nativa, funciona em qualquer imagem Docker Linux sem apt-get extra. Projeto ativo, usado amplamente em projetos .NET open-source. |
| **iText7** | AGPL v3 **ou** comercial paga | Não | **Não recomendado — risco de licença.** AGPL exige que, se o software for distribuído/rodado como serviço acessível a terceiros, o código-fonte completo (incluindo integrações) seja disponibilizado sob AGPL também — incompatível com manter o app fechado, mesmo sendo uso pessoal, a menos que se compre a licença comercial (paga, recorrente). Não faz sentido pagar licença para um app de uma pessoa só. |
| **Docnet.Core** (wrapper PDFium) | MIT (wrapper) mas depende de binário nativo do PDFium | Sim — biblioteca nativa por plataforma | Funciona, mas adiciona complexidade de build/imagem Docker (garantir binário nativo Linux x64 correto na imagem) para um ganho que o PdfPig já cobre sem isso. |
| **PdfSharp** | MIT | Não | Focado em **geração/manipulação** de PDF (o caso de uso inverso — se um dia quisermos gerar o "relatório mensal exportável" do item 2.6 do mapeamento de features em PDF, essa seria a lib certa). Extração de texto é secundária e menos madura que PdfPig. |

**Recomendação**: `UglyToad.PdfPig`. Licença permissiva, zero dependência nativa (relevante para o Dockerfile atual, que não teria que instalar libs de sistema), API de extração por posição adequada ao problema real (ver seção 3), e mantido ativamente.

---

## 3. Realidade estrutural do PDF de fatura brasileiro

Faturas de cartão de banco brasileiro baixadas em PDF (Nubank, Inter, Itaú, etc.) **quase sempre são PDFs de texto nativo, não digitalizações/imagem** — são gerados programaticamente pelo banco a partir de dados internos, não escaneados. Não há motivo para assumir OCR seja necessário aqui; isso só mudaria se, na prática, o Rafael importar um PDF e a extração de texto vier vazia (sinal de PDF só-imagem), o que se descobre no primeiro teste real, não antecipadamente.

O que **não** existe nesses PDFs é uma tabela HTML-like com colunas marcadas — o stream de texto de um PDF é uma sequência de "runs" de texto posicionados por coordenada (X, Y), sem relação estrutural declarada entre uma célula "data" e a célula "valor" da mesma linha visual. Extrair isso corretamente exige um de dois caminhos:

1. **Clustering genérico por coordenada Y** (agrupar todo texto que compartilha a mesma faixa de Y como "uma linha", depois usar heurísticas de X para separar colunas) — funciona para qualquer banco em tese, mas é frágil: layouts variam (larguras de coluna, presença/ausência de parcela "x/y", moeda estrangeira em fatura internacional, subtotmelas por seção), e cada heurística nova quebra silenciosamente com o próximo extrato de um banco não testado.
2. **Template por emissor** (um regex/parser dedicado por banco, selecionado pelo cartão escolhido no upload) — o layout de uma fatura é **estável dentro do mesmo banco** (mesmo timestamp de geração, mesmo sistema interno), só não é padronizado **entre** bancos.

**Decisão proposta: opção 2 — parser por template de emissor.** Esta é a escolha "preguiçosa correta" para um app de uma pessoa só com no máximo 3 cartões ativos (regra de domínio já existente, `LimiteMaximoCartoesAtivos = 3`): construir um parser genérico "tolerante a qualquer banco" é engenharia de produto multi-tenant disfarçada de feature pessoal — o mesmo tipo de excesso que o item 2.10 do mapeamento de features (`docs/product/mapeamento-features-2026-08-01.md`) já rejeitou para multi-conta/multi-moeda. Rafael tem 1-3 bancos reais; um parser dedicado por banco, escrito e ajustado uma vez contra um PDF real daquele banco, é mais barato de construir e **muito** mais barato de debugar do que um parser genérico com heurísticas que quebram em casos de borda nunca vistos.

---

## 4. Trust boundary e segurança de dado financeiro

Upload de arquivo é a primeira superfície de trust boundary nova do app (hoje só há JWT + payloads JSON tipados). Precisa de tratamento explícito:

- **Validação de tipo/tamanho**: aceitar apenas `Content-Type: application/pdf` e magic bytes `%PDF-`; limite de tamanho de request (ex. 10 MB — uma fatura de texto raramente passa de 1-2 MB; um limite baixo também reduz superfície de DoS por upload de arquivo gigante). `Program.cs` não configura `MaxRequestBodySize`/`RequestSizeLimit` hoje — precisa ser adicionado especificamente para este endpoint, não globalmente.
- **Nenhuma execução de conteúdo do PDF**: PdfPig faz só extração de texto/posição, não interpreta JavaScript embutido ou abre recursos externos referenciados no PDF — não introduz esse risco por si só, mas vale registrar como decisão consciente (não usar uma lib que renderize o PDF como se fosse um visualizador).
- **Sem persistência do PDF original**: processar em memória (stream) e descartar após a extração — não há necessidade de guardar o arquivo fonte, reduz superfície de dado sensível em disco.
- **Staging/review antes de persistir** (ver seção 5): dado financeiro nunca deve ser gravado direto a partir de um parser automático sem confirmação humana — um valor extraído errado (ex.: confundir "R$ 1.234,56" com "R$ 1.234" por erro de regex de milhar) que virasse `Movimentacao` direto seria silenciosamente errado até o Rafael notar no extrato consolidado, o que pode ser semanas depois.
- **Detecção de duplicata**: comparar candidatos extraídos contra `Movimentacao` já existentes para o mesmo `CartaoId` + `CompetenciaFatura` antes de permitir confirmação — evita reimportar a mesma fatura duas vezes (ex.: Rafael importa, confirma, e sem querer faz upload do mesmo PDF de novo semana seguinte). Hoje não existe query pronta para isso; `IMovimentacaoRepository` (`server/Core/Repositories/IMovimentacaoRepository.cs:5-19`) teria que ganhar um método tipo `ListarPorCartaoECompetencia(Guid cartaoId, int competencia, Guid usuarioId)`.

---

## 5. Fluxo proposto

Duas etapas, nunca uma escrita direta:

```
1) Upload            → extrai + faz parse → devolve candidatos NÃO salvos
   POST /api/v1/cartao/{cartaoId}/importar-fatura/preview   (multipart/form-data, PDF)

2) Revisão do usuário → edita/remove itens na UI → confirma
   POST /api/v1/cartao/{cartaoId}/importar-fatura/confirmar (JSON, lista de itens confirmados)
     → por item: monta Saida (mesma lógica de MovimentacoesController.CriarMovimentacao)
     → chama CriarMovimentacaoUseCase.Executar(...) por item (reaproveita validação de domínio existente)
```

### 5.1 Use cases novos (assinatura, não implementação)

- **`ImportarFaturaPdfPreviewUseCase`**: recebe bytes do PDF + `cartaoId` + `usuarioId`. Fluxo: valida cartão pertence ao usuário → extrai texto via PdfPig → seleciona parser por `CartaoManual.Nome` (ou por um novo campo `EmissorTemplate` — ver 5.3) → roda o parser do emissor → para cada linha, calcula `CompetenciaFatura` via `CompetenciaFaturaCalculator.CalcularCompetencia` (reaproveitado, não recalculado) → consulta duplicatas já existentes para aquele `CartaoId`+competência → retorna lista de candidatos com flag de duplicata suspeita, **sem gravar nada**.
- **`ConfirmarImportacaoFaturaUseCase`**: recebe lista de itens confirmados/editados pelo usuário + `cartaoId` + `usuarioId`. Para cada item: monta `Saida` (mesmo padrão do controller) e chama `CriarMovimentacaoUseCase.Executar` — sem caminho de persistência novo, 100% reaproveitamento.

### 5.2 DTOs (nível de assinatura)

```csharp
// Item candidato devolvido no preview — ainda não persistido
public record FaturaImportadaItemDTO(
    string Titulo,
    decimal Valor,
    DateTime Data,
    int CompetenciaFatura,
    bool PossivelDuplicata,
    Guid? CategoriaIdSugerida = null   // se houver match heurístico simples por palavra-chave de título; opcional, pode ficar null na v1
);

// Resposta do preview
public record ImportarFaturaPreviewResultadoDTO(
    Guid CartaoId,
    string EmissorDetectado,
    IReadOnlyList<FaturaImportadaItemDTO> Itens,
    IReadOnlyList<string> LinhasNaoReconhecidas // texto bruto que o parser não conseguiu casar — visibilidade de falha, não descarte silencioso
);

// Payload de confirmação (usuário já revisou/editou/removeu itens no frontend)
public record ImportarFaturaConfirmacaoDTO(
    Guid CartaoId,
    IReadOnlyList<FaturaImportadaItemDTO> ItensConfirmados
);
```

`LinhasNaoReconhecidas` importa: um parser por template vai falhar silenciosamente em algumas linhas (ex.: taxa de IOF, juros rotativo, estorno) se o template não previu aquele formato — expor o texto bruto não reconhecido na resposta do preview é o que permite ao Rafael perceber "faltou um lançamento" em vez de descobrir isso só quando o saldo não bater.

### 5.3 Seleção de parser por emissor

`CartaoManual.Nome` é texto livre — não é seguro usar como chave de seleção de parser (o Rafael pode ter nomeado "Nubank Roxo" ou "Cartão principal"). Duas opções, e a recomendação é a segunda:

- (a) Fazer matching por substring conhecida em `Nome` (frágil, quebra se o nome mudar).
- (b) **Adicionar um campo novo `EmissorTemplate` (enum ou string) em `CartaoManual`**, preenchido explicitamente no cadastro/edição do cartão (dropdown com os bancos suportados) — precisa de migration pequena, mas é a única forma confiável de saber qual parser rodar sem adivinhar a partir de texto livre.

---

## 6. Fora de escopo — o que **não** construir agora, e por quê

- **Parser genérico multi-banco / OCR / ML de layout**: rejeitado na seção 3 — over-engineering para 1-3 bancos conhecidos de um usuário único.
- **OCR para PDF escaneado**: sem evidência de que os PDFs do Rafael sejam imagem (faturas de banco BR baixadas do app/site são geradas como texto nativo, não escaneadas) — só revisitar se um teste real mostrar extração de texto vazia.
- **Integração bancária via Open Finance/API do banco**: fora de escopo por design do módulo de cartão inteiro — `CartaoManual` já é descrito no CHANGELOG como "módulo apenas visualizador manual, sem integração bancária" (`specs/010-cartao-visualizador-sem-integracao/spec.md:25`), decisão de produto anterior que este documento não está questionando.
- **Categorização automática por ML/heurística complexa**: o campo `CategoriaIdSugerida` no DTO acima é opcional e, na v1, pode ficar sempre `null` (usuário categoriza manualmente na tela de revisão, como já faz hoje ao criar transação) — matching por palavra-chave é uma evolução de v2 se o volume de lançamentos por fatura tornar a categorização manual cansativa, não um requisito de v1.
- **Suporte a fatura de conta corrente/extrato bancário genérico**: escopo é fatura de **cartão de crédito**, que é o que gera `CompetenciaFatura`; extrato de conta corrente é um problema diferente (sem ciclo de fechamento) e não foi pedido.
- **Guardar o PDF original após processar**: decisão deliberada na seção 4 — reduz superfície de dado sensível, sem caso de uso claro para reter o arquivo fonte.

---

## 7. Backend/dados necessários

| Item | Mudança necessária |
|---|---|
| Seleção de parser por emissor | Novo campo `EmissorTemplate` em `CartaoManual` (migration nova) + atualização de `CadastrarCartaoManualUseCase`/`EditarCartaoManualUseCase`/DTOs correspondentes. |
| Extração de texto do PDF | Novo pacote NuGet `UglyToad.PdfPig` no `API.csproj` ou `Infrastructure.csproj` (extração é detalhe de infraestrutura, não de domínio). |
| Parsers por banco | 1-3 classes novas (`INotaFaturaParser` + implementação por emissor), sem abstração especulativa além da necessária para os bancos reais do Rafael — **não construir suporte a bancos hipotéticos**. |
| Cálculo de competência por linha | Nenhuma mudança — reaproveita `CompetenciaFaturaCalculator.CalcularCompetencia` como está. |
| Detecção de duplicata | Novo método em `IMovimentacaoRepository`: `ListarPorCartaoECompetencia(Guid cartaoId, int competencia, Guid usuarioId)`. |
| Endpoint de preview | Novo `POST /api/v1/cartao/{cartaoId}/importar-fatura/preview`, `multipart/form-data`, com `RequestSizeLimit` explícito (não configurado hoje em `Program.cs`). |
| Endpoint de confirmação | Novo `POST /api/v1/cartao/{cartaoId}/importar-fatura/confirmar`, JSON — reaproveita `CriarMovimentacaoUseCase` por item confirmado (idealmente após extrair a montagem de `Saida` do controller para um helper compartilhado, hoje duplicada entre criar/atualizar). |
| Frontend — upload | Novo botão "Importar Fatura" em `CardsSlide.jsx` (ao lado de "Editar Cartão", `CardsSlide.jsx:256-266`) + novo modal de revisão (lista editável de `FaturaImportadaItemDTO`, com toggle de seleção por linha e destaque visual para `PossivelDuplicata`/`LinhasNaoReconhecidas`) — primeiro componente de upload de arquivo do client. |
| Frontend — API client | Nova entrada em `client/src/services/api.js`, padrão `API_CARTAO_URL` + sub-path (`api.js:23`). |

---

## 8. Impacto / Esforço e sequenciamento

**[Impacto Alto / Esforço Grande]**

Impacto alto porque resolve a dor original relatada ("digitar cada lançamento da fatura à mão"), que é objetivamente mais fricção recorrente do que qualquer item do Ciclo C do mapeamento de features. Esforço grande porque, diferente de todos os itens dos Ciclos A/B/C (que reaproveitam dado e cálculo já existentes, só recompondo apresentação ou consultas agregadas), esta feature introduz **três coisas novas ao mesmo tempo que o app nunca teve**: upload de arquivo (trust boundary novo), dependência externa de parsing de PDF, e um fluxo de dois estágios (preview não-persistido → confirmação) que não existe em nenhum outro use case hoje — todo o resto do app é criação direta (`CriarMovimentacaoUseCase` chamado uma vez, imediatamente persistido).

Comparado aos itens do Ciclo C ainda pendentes:

- **2.6 (relatório mensal exportável)** e **2.7 (busca global)** são recomposição de dado já calculado — esforço médio real, sem trust boundary novo.
- **3.2 (consolidação de cards)** é puramente reorganização visual.
- **Import de fatura PDF é estruturalmente maior que os três juntos** — não porque a lógica de negócio seja complexa (o domínio `Movimentacao`/`CartaoManual`/`CompetenciaFaturaCalculator` já resolve o difícil), mas porque parsing de PDF de terceiro + upload + fluxo de revisão são categorias de trabalho que o app nunca fez.

**Recomendação de sequenciamento: merece um "Ciclo D" próprio, não encaixar dentro do Ciclo C.**

Motivos:
1. Depende de uma decisão de produto que só o Rafael pode tomar (quais bancos ele realmente usa — seção 1.5) antes que uma única linha de parser seja escrita; os itens do Ciclo C não têm essa dependência externa.
2. É a primeira feature do app com superfície de ataque de upload de arquivo — vale isolar em um ciclo com atenção dedicada a validação de trust boundary (seção 4), não diluir junto com itens de puro reaproveitamento de dado.
3. Tem valor solto mesmo se atrasado — nenhum item do Ciclo C fica bloqueado esperando por ele, e ele não bloqueia nenhum item do Ciclo C.

Ordem sugerida dentro do próprio Ciclo D, se/quando for iniciado:
1. Confirmar com o Rafael quais bancos reais precisam de template (pré-requisito, não é trabalho de engenharia).
2. Endpoint de preview + parser do primeiro banco + tela de revisão (fatia vertical completa para 1 banco só, validando o fluxo ponta a ponta antes de generalizar para o segundo/terceiro).
3. Endpoint de confirmação reaproveitando `CriarMovimentacaoUseCase`.
4. Parsers dos bancos restantes, um de cada vez, contra PDF real.
