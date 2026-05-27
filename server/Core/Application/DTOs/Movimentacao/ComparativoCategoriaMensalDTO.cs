namespace Finance.Core.Application.DTOs;

public record ComparativoCategoriaMensalDTO(
    int Mes,
    int Ano,
    string Categoria,
    decimal TotalEntradas,
    decimal TotalSaidas
);