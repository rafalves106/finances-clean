namespace Finance.Core.Application.DTOs;

public record VeiculoDTO(
  string Nome,
  string Marca,
  string Modelo,
  int Ano,
  string Placa,
  int AlertaKm
);
