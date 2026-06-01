namespace Finance.Core.Application.DTOs;

public record EditarCartaoManualDTO(
    string Nome,
    decimal LimiteTotal,
    int DiaFechamento,
    int DiaVencimento,
    string? NumeroCartao = null,
    string? Cvv = null,
    string? Token = null
);
