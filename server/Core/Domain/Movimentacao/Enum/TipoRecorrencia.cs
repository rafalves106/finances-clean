using System.Text.Json.Serialization;

namespace Finance.Core.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoRecorrencia
{
  Mensal = 0,
  Semanal = 1
}