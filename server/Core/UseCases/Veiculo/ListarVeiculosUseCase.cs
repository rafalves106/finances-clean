using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarVeiculosUseCase(IVeiculoRepository _veiculoRepository, IMovimentacaoRepository _movimentacaoRepository)
{
  public IEnumerable<VeiculoResponseDTO> Executar()
  {
    var veiculos = _veiculoRepository.ListarTodos();
    var movimentacoes = _movimentacaoRepository.ListarTodas();

    return veiculos.Select(v =>
    {
      var movimentacoesVeiculo = movimentacoes.Where(m => m.VeiculoId == v.Id).ToList();

      var kmAtual = movimentacoesVeiculo
        .Where(m => m.Km.HasValue)
        .Select(m => m.Km.Value)
        .DefaultIfEmpty(0)
        .Max();

      var totalGasto = movimentacoesVeiculo
        .Where(m => m.Tipo == TipoMovimentacao.Saida)
        .Sum(m => m.Valor);

      var alertaPendente = kmAtual > 0 && (kmAtual - v.UltimoKmAlerta) >= v.AlertaKm;

      return new VeiculoResponseDTO(
        v.Id,
        v.Nome,
        v.Marca,
        v.Modelo,
        v.Ano,
        v.Placa,
        v.AlertaKm,
        v.UltimoKmAlerta,
        kmAtual > 0 ? kmAtual : null,
        alertaPendente,
        totalGasto
      );
    });
  }
}
