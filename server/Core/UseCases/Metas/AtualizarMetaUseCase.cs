using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.Application.DTOs;

namespace Finance.Core.UseCases;

public class AtualizarMetaUseCase(IMetaRepository _metaRepository)
{
  public void Executar(Guid id, MetaDTO dto)
  {
    var meta = _metaRepository.BuscarPorId(id)
        ?? throw new ArgumentException($"Meta {id} não encontrada.");

    meta.Atualizar(dto.Descricao, dto.Valor, dto.DataAlvo);
    _metaRepository.Atualizar(meta);
  }
}