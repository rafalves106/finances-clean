using System.Text.Json.Serialization;

namespace Finance.Core.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Liquidez
{
    Diaria,       
    NoVencimento, 
    PrazoFechado  
}