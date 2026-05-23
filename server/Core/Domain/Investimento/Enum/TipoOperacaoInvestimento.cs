using System.Text.Json.Serialization;

namespace Finance.Core.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoOperacaoInvestimento
{
    Aporte,
    Saque,
    Rendimento
}