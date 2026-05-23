using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class AtualizarUltimoKmAlertaUseCase(IVeiculoRepository _veiculoRepository)
{
  public void Executar(Guid id, int km)
  {
    var veiculo = _veiculoRepository.BuscarPorId(id)
      ?? throw new KeyNotFoundException($"Veículo com ID {id} não encontrado.");

    veiculo.AtualizarUltimoKmAlerta(km);
    _veiculoRepository.Atualizar(veiculo);
  }
}
