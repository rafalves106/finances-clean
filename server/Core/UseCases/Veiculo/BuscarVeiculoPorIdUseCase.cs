using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class BuscarVeiculoPorIdUseCase(IVeiculoRepository _veiculoRepository, IMovimentacaoRepository _movimentacaoRepository)
{
  public VeiculoResponseDTO? Executar(Guid id)
  {
    var veiculo = _veiculoRepository.BuscarPorId(id);
    if (veiculo is null)
      return null;

    var movimentacoes = _movimentacaoRepository.ListarTodas();
    var movimentacoesVeiculo = movimentacoes.Where(m => m.VeiculoId == veiculo.Id).ToList();

    var kmAtual = movimentacoesVeiculo
      .Where(m => m.Km.HasValue)
      .Select(m => m.Km.Value)
      .DefaultIfEmpty(0)
      .Max();

    var totalGasto = movimentacoesVeiculo
      .Where(m => m.Tipo == TipoMovimentacao.Saida)
      .Sum(m => m.Valor);

    var alertaPendente = kmAtual > 0 && (kmAtual - veiculo.UltimoKmAlerta) >= veiculo.AlertaKm;

    return new VeiculoResponseDTO(
      veiculo.Id,
      veiculo.Nome,
      veiculo.Marca,
      veiculo.Modelo,
      veiculo.Ano,
      veiculo.Placa,
      veiculo.AlertaKm,
      veiculo.UltimoKmAlerta,
      kmAtual > 0 ? kmAtual : null,
      alertaPendente,
      totalGasto
    );
  }
}
