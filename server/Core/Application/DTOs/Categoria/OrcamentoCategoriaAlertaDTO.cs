namespace Finance.Core.Application.DTOs;

public record OrcamentoCategoriaAlertaDTO(
  Guid CategoriaId,
  string Nome,
  string? Icone,
  string? Cor,
  decimal OrcamentoMensal,
  decimal TotalDespesasMesAtual,
  decimal PercentualConsumo,
  string EstadoAlerta
);

public record ResumoAlertasOrcamentoCategoriasDTO(
  int Mes,
  int Ano,
  int TotalCategoriasEmAlerta,
  IEnumerable<OrcamentoCategoriaAlertaDTO> Categorias
);