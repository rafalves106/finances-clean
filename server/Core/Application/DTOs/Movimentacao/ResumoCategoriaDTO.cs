namespace Finance.Core.Application.DTOs;

public record ResumoCategoriaDTO(
    Guid? CategoriaId,
    string Nome,
    string? Icone,
    string? Cor,
    decimal TotalEntradas,
    decimal TotalSaidas
);