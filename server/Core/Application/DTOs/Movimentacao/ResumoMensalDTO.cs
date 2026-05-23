namespace Finance.Core.Application.DTOs;

public record ResumoMensalDTO(
    int Mes,
    int Ano,
    decimal TotalEntradas,
    decimal TotalSaidas,
    decimal RendaSalario,
    decimal Saldo,
    IEnumerable<ResumoCategoriaDTO> PorCategoria
);