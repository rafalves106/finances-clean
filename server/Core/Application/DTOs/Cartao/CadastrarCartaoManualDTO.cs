namespace Finance.Core.Application.DTOs;

public record CadastrarCartaoManualDTO(
    string Nome,
    decimal LimiteTotal,
    int DiaFechamento,
    int DiaVencimento,
    string? CorTema = null,
    string? NumeroCartao = null,
    string? Cvv = null,
    string? Token = null
);
