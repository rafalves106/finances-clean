using Finance.Core.Domain;

namespace Finance.Core.Application.DTOs;

public record CriarInvestimentoDTO(
    string Nome, 
    string Instituicao, 
    TipoInvestimento Tipo, 
    decimal ValorAplicado, 
    DateTime DataInicio, 
    TipoRentabilidade TipoRentabilidade, 
    Liquidez Liquidez, 
    DateTime? DataVencimento = null, 
    decimal? TaxaRendimento = null
);