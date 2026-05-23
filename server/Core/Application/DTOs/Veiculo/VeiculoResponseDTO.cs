namespace Finance.Core.Application.DTOs;

public record VeiculoResponseDTO(
  Guid Id,
  string Nome,
  string Marca,
  string Modelo,
  int Ano,
  string Placa,
  int AlertaKm,
  int UltimoKmAlerta,
  int? KmAtual,
  bool AlertaPendente,
  decimal TotalGasto
);
