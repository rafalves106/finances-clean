using System.Text.Json.Serialization;

namespace Finance.Core.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoMovimentacaoFixa
{
  RecorrenteFixa = 0,
  Parcelada = 1
}