namespace Finance.Core.Application.DTOs;

public record FaturaVencendoDTO(Guid CartaoId, string NomeCartao, decimal Valor, DateTime DataVencimento);
