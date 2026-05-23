using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CriarVeiculoUseCase(IVeiculoRepository _veiculoRepository)
{
  public Guid Executar(Guid usuarioId, VeiculoDTO dto)
  {
    var veiculo = new Veiculo(dto.Nome, dto.Marca, dto.Modelo, dto.Ano, dto.Placa, dto.AlertaKm, usuarioId);
    return _veiculoRepository.Adicionar(veiculo);
  }
}
