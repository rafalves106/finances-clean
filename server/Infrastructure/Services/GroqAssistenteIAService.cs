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

      Responda SOMENTE com um JSON no formato exato, sem nenhum texto fora do JSON:
      {
        "entendido": true ou false,
        "titulo": "string curta, ou null",
        "valor": número positivo, ou null,
        "data": "YYYY-MM-DD", ou null,
        "tipo": "Entrada" ou "Saida", ou null,
        "categoriaId": "guid de uma das categorias acima, ou null",
        "observacao": "string curta explicando qualquer suposição feita, ou null"
      }

      Se o texto não descrever claramente uma movimentação financeira (não dá pra saber o
      valor e do que se trata), responda com "entendido": false e explique o motivo em
      "observacao".
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

      return new InterpretacaoMovimentacaoResultado(
        true, extraido.Titulo, valor, data, tipo, categoriaId, extraido.Observacao);
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
  }
}
