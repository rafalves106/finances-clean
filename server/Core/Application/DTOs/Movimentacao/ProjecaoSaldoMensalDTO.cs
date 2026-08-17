namespace Finance.Core.Application.DTOs;

public record ProjecaoSaldoMensalDTO(
    int Mes,
    int Ano,
    decimal TotalEntradas,
    decimal TotalSaidas,
    decimal SaldoMes,
    decimal SaldoAcumulado
);
