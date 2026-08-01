using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.Application.DTOs;

namespace Finance.Core.UseCases;

public class CriarMetaUseCase(IMetaRepository _metaRepository)
{
  public Guid Executar(Guid usuarioId, MetaDTO dto)
  {
    var meta = new Meta(dto.Descricao, dto.Valor, usuarioId, dto.DataAlvo, dto.CategoriaId, dto.InvestimentoId);
    return _metaRepository.Adicionar(meta);
  }
}