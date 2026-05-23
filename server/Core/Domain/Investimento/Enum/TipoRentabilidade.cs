using System.Text.Json.Serialization;

namespace Finance.Core.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoRentabilidade
{
    PosFixado, 
    PreFixado, 
    IPCA,      
    Variavel   
}