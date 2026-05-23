using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class AtualizarVeiculoUseCase(IVeiculoRepository _veiculoRepository)
{
  public void Executar(Guid id, VeiculoDTO dto)
  {
    var veiculo = _veiculoRepository.BuscarPorId(id)
      ?? throw new KeyNotFoundException($"Veículo com ID {id} não encontrado.");

    veiculo.Atualizar(dto.Nome, dto.Marca, dto.Modelo, dto.Ano, dto.Placa, dto.AlertaKm);
    _veiculoRepository.Atualizar(veiculo);
  }
}
