using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Finance.Core.Services;
using Microsoft.Extensions.Configuration;

namespace Finance.Infrastructure.Services;

// Chama a API da Groq (compatível com o formato OpenAI) pra extrair dados
// estruturados de uma descrição em texto livre de uma movimentação. Nunca
// lança em falha de rede/parsing - devolve Entendido=false com uma
// observação, pra UI mostrar um erro amigável em vez de quebrar o fluxo.
public class GroqAssistenteIAService(HttpClient httpClient, IConfiguration configuration) : IAssistenteIAService
{
  private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

  public async Task<InterpretacaoMovimentacaoResultado> InterpretarMovimentacao(
    string texto, DateTime dataReferencia, IReadOnlyList<CategoriaResumoIA> categorias)
  {
    var model = configuration["Groq:Model"] ?? "llama-3.3-70b-versatile";
    var categoriasTexto = categorias.Count == 0
      ? "(nenhuma categoria cadastrada)"
      : string.Join("\n", categorias.Select(c => $"- {c.Id}: {c.Nome}"));

    var systemPrompt = $$"""
      Você extrai dados estruturados de uma descrição em português de uma movimentação
      financeira pessoal (uma compra, um recebimento, um pagamento).

      Data de hoje: {{dataReferencia:yyyy-MM-dd}}. Resolva datas relativas ("ontem", "hoje",
      "sexta passada", "semana passada") com base nisso.

      Categorias disponíveis (escolha o Id de UMA delas, ou null se nenhuma se encaixar
      claramente - NUNCA invente uma categoria fora desta lista):
      {{categoriasTexto}}

      Também detecte se a movimentação é PARCELADA ou RECORRENTE:

      - Parcelamento (ex: "em 10x", "parcelado em 5 vezes", "10 parcelas"): tipoMovimentacaoFixa
        = "Parcelada", fixa = true, periodo = número de parcelas. O campo "valor" deve ser
        SEMPRE o valor de CADA parcela: se o texto já der o valor por parcela ("10x de 300"),
        use 300 direto; se der o valor TOTAL da compra ("notebook de 3000 em 10x"), calcule
        valor = 3000 / 10 = 300.

      - Recorrência (ex: "todo mês", "mensalmente", "assinatura", "toda semana",
        "semanalmente", "recorrente"): tipoMovimentacaoFixa = "RecorrenteFixa", fixa = true,
        tipoRecorrencia = "Mensal" ou "Semanal" conforme o texto. periodo = número de
        ocorrências a lançar; se o texto não disser por quanto tempo, use 12. Se disser um
        prazo ("por 6 meses"), use esse número.

      - Se não houver nenhuma dessas pistas, é uma movimentação avulsa: fixa = false,
        periodo = null, tipoRecorrencia = null, tipoMovimentacaoFixa = null.

      Além de CRIAR, você também detecta pedidos pra REMOVER/EXCLUIR/APAGAR/DELETAR
      movimentações já existentes (ex: "remove a compra do notebook", "apaga todas as
      saídas de agosto", "exclui a assinatura da netflix", "limpa as saídas desse mês").

      Quando o texto pedir remoção (não criação de uma nova movimentação):
      - "intent" = "Remover"
      - "filtroTermoBusca": palavra-chave do título pra buscar (ex: "notebook"), ou null
        se o pedido não menciona um título específico (ex: "todas as saídas de agosto").
      - "filtroTipo": "Entrada" ou "Saida", ou null se não especificado.
      - "filtroMes": número do mês (1 a 12) mencionado, ou null se não especificado.
      - "filtroAno": ano mencionado; se um mês foi mencionado sem ano, use o ano de
        {{dataReferencia:yyyy}}; se nem mês nem ano foram mencionados, deixe null.
      - Todos os outros campos (titulo, valor, data, tipo, categoriaId, fixa, periodo,
        tipoRecorrencia, tipoMovimentacaoFixa) devem ficar null/false - ignore-os.

      Quando for criar uma movimentação normal (o caso mais comum), "intent" = "Criar" e
      ignore os campos de filtro (deixe null).

      Responda SOMENTE com um JSON no formato exato, sem nenhum texto fora do JSON:
      {
        "entendido": true ou false,
        "intent": "Criar" ou "Remover",
        "titulo": "string curta, ou null",
        "valor": número positivo (valor de UMA parcela/ocorrência se fixa=true), ou null,
        "data": "YYYY-MM-DD", ou null,
        "tipo": "Entrada" ou "Saida", ou null,
        "categoriaId": "guid de uma das categorias acima, ou null",
        "observacao": "string curta explicando qualquer suposição feita, ou null",
        "fixa": true ou false,
        "periodo": número inteiro positivo de parcelas/ocorrências, ou null se fixa=false,
        "tipoRecorrencia": "Mensal" ou "Semanal", ou null se não for recorrente,
        "tipoMovimentacaoFixa": "Parcelada" ou "RecorrenteFixa", ou null se fixa=false,
        "filtroTermoBusca": "string ou null (só quando intent=Remover)",
        "filtroTipo": "Entrada" ou "Saida", ou null,
        "filtroMes": número de 1 a 12, ou null,
        "filtroAno": número do ano, ou null
      }

      Se o texto não descrever claramente uma movimentação financeira nem um pedido de
      remoção (não dá pra saber o que fazer), responda com "entendido": false e explique
      o motivo em "observacao".
      """;

    var payload = new
    {
      model,
      messages = new object[]
      {
        new { role = "system", content = systemPrompt },
        new { role = "user", content = texto },
      },
      response_format = new { type = "json_object" },
      temperature = 0,
    };

    HttpResponseMessage response;
    try
    {
      response = await httpClient.PostAsJsonAsync("chat/completions", payload);
    }
    catch (Exception)
    {
      return NaoEntendido("Não consegui falar com o assistente agora. Tente de novo em instantes.");
    }

    if (!response.IsSuccessStatusCode)
    {
      return NaoEntendido("Não consegui falar com o assistente agora. Tente de novo em instantes.");
    }

    try
    {
      var body = await response.Content.ReadFromJsonAsync<GroqChatResponse>();
      var conteudo = body?.Choices?.FirstOrDefault()?.Message?.Content;
      if (string.IsNullOrWhiteSpace(conteudo))
      {
        return NaoEntendido("Não consegui interpretar a resposta do assistente.");
      }

      var extraido = JsonSerializer.Deserialize<ExtracaoDTO>(conteudo, JsonOptions);
      if (extraido is null || !extraido.Entendido)
      {
        return NaoEntendido(extraido?.Observacao ?? "Não entendi essa movimentação.");
      }

      if (extraido.Intent == "Remover")
      {
        var filtroTipo = extraido.FiltroTipo is "Entrada" or "Saida" ? extraido.FiltroTipo : null;
        var filtroMes = extraido.FiltroMes is >= 1 and <= 12 ? extraido.FiltroMes : null;
        var filtroAno = extraido.FiltroAno is > 0 ? extraido.FiltroAno : null;
        var filtroTermoBusca = string.IsNullOrWhiteSpace(extraido.FiltroTermoBusca)
          ? null
          : extraido.FiltroTermoBusca.Trim();

        // Exige ao menos um critério - "remove" sozinho, sem nenhuma pista, é vago
        // demais pra apagar qualquer coisa com segurança.
        if (filtroTermoBusca is null && filtroTipo is null && filtroMes is null)
        {
          return NaoEntendido("Preciso de mais detalhes pra saber o que remover - diga um título, tipo (entrada/saída) ou mês.");
        }

        return new InterpretacaoMovimentacaoResultado(
          true, null, null, null, null, null, null,
          Intent: "Remover",
          FiltroTermoBusca: filtroTermoBusca,
          FiltroTipo: filtroTipo,
          FiltroMes: filtroMes,
          FiltroAno: filtroAno);
      }

      Guid? categoriaId = null;
      if (!string.IsNullOrWhiteSpace(extraido.CategoriaId) &&
          Guid.TryParse(extraido.CategoriaId, out var parsedCategoriaId) &&
          categorias.Any(c => c.Id == parsedCategoriaId))
      {
        categoriaId = parsedCategoriaId;
      }

      DateTime? data = null;
      if (!string.IsNullOrWhiteSpace(extraido.Data) && DateTime.TryParse(extraido.Data, out var parsedData))
      {
        data = parsedData;
      }

      var tipo = extraido.Tipo is "Entrada" or "Saida" ? extraido.Tipo : null;
      var valor = extraido.Valor is > 0 ? extraido.Valor : null;

      // Só aceita fixa/parcelamento/recorrência com uma combinação válida e
      // completa - qualquer inconsistência (tipo desconhecido, período <= 0)
      // cai pra movimentação avulsa em vez de mandar dado incoerente pro
      // formulário (evita fixa=true sem período, por exemplo).
      var tipoMovimentacaoFixa = extraido.TipoMovimentacaoFixa is "Parcelada" or "RecorrenteFixa"
        ? extraido.TipoMovimentacaoFixa
        : null;
      var tipoRecorrencia = extraido.TipoRecorrencia is "Mensal" or "Semanal"
        ? extraido.TipoRecorrencia
        : null;
      var periodo = extraido.Periodo is > 0 ? extraido.Periodo : null;
      var fixa = extraido.Fixa && tipoMovimentacaoFixa is not null && periodo is not null;

      if (!fixa)
      {
        tipoMovimentacaoFixa = null;
        tipoRecorrencia = null;
        periodo = null;
      }
      else if (tipoMovimentacaoFixa == "Parcelada")
      {
        tipoRecorrencia = null;
      }
      else
      {
        tipoRecorrencia ??= "Mensal";
      }

      return new InterpretacaoMovimentacaoResultado(
        true, extraido.Titulo, valor, data, tipo, categoriaId, extraido.Observacao,
        fixa, periodo, tipoRecorrencia, tipoMovimentacaoFixa);
    }
    catch (Exception)
    {
      return NaoEntendido("Não consegui interpretar a resposta do assistente.");
    }
  }

  private static InterpretacaoMovimentacaoResultado NaoEntendido(string motivo) =>
    new(false, null, null, null, null, null, motivo);

  private sealed class GroqChatResponse
  {
    [JsonPropertyName("choices")]
    public List<GroqChoice>? Choices { get; set; }
  }

  private sealed class GroqChoice
  {
    [JsonPropertyName("message")]
    public GroqMessage? Message { get; set; }
  }

  private sealed class GroqMessage
  {
    [JsonPropertyName("content")]
    public string? Content { get; set; }
  }

  private sealed class ExtracaoDTO
  {
    public bool Entendido { get; set; }
    public string? Titulo { get; set; }
    public decimal? Valor { get; set; }
    public string? Data { get; set; }
    public string? Tipo { get; set; }
    public string? CategoriaId { get; set; }
    public string? Observacao { get; set; }
    public bool Fixa { get; set; }
    public int? Periodo { get; set; }
    public string? TipoRecorrencia { get; set; }
    public string? TipoMovimentacaoFixa { get; set; }
    public string? Intent { get; set; }
    public string? FiltroTermoBusca { get; set; }
    public string? FiltroTipo { get; set; }
    public int? FiltroMes { get; set; }
    public int? FiltroAno { get; set; }
  }
}
