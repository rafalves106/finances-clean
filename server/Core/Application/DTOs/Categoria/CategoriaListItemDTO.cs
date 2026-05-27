namespace Finance.Core.Application.DTOs;

public record CategoriaListItemDTO(
  Guid Id,
  string Nome,
  string? Icone,
  string? Cor,
  bool IsGlobal,
  decimal? OrcamentoMensal
);