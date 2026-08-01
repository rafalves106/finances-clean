namespace Finance.Core.Application.DTOs;

public record CartaoPrevisaoFaturaMesDTO(int Competencia, decimal Valor);

public record CartaoPrevisaoFaturaFuturaDTO(
  Guid CartaoId,
  IReadOnlyList<CartaoPrevisaoFaturaMesDTO> Meses
);
