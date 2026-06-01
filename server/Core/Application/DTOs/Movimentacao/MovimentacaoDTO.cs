using Finance.Core.Domain;

namespace Finance.Core.Application.DTOs;

public record MovimentacaoDTO(
  string Titulo,
  string? Descricao,
  decimal Valor,
  DateTime Data,
  TipoMovimentacao Tipo,
  bool Fixa = false,
  int Periodo = 0,
  Guid? InvestimentoId = null,
  Guid? CartaoId = null,
  int? CompetenciaFatura = null,
  Guid? CategoriaId = null,
  Guid? VeiculoId = null,
  int? Km = null,
  TipoRecorrencia TipoRecorrencia = TipoRecorrencia.Mensal,
  TipoMovimentacaoFixa TipoMovimentacaoFixa = TipoMovimentacaoFixa.RecorrenteFixa
);