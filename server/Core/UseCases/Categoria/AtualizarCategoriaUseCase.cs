using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class AtualizarCategoriaUseCase(
  ICategoriaRepository categoriaRepository,
  ICategoriaOrcamentoUsuarioRepository categoriaOrcamentoUsuarioRepository)
{
  public void Executar(Guid usuarioId, Guid id, CategoriaDTO dto)
  {
    var categoria = categoriaRepository.BuscarPorId(id)
        ?? throw new ArgumentException($"Categoria {id} não encontrada.");

    if (categoria.IsGlobal)
    {
      var overrideAtual = categoriaOrcamentoUsuarioRepository
        .BuscarPorCategoriaGlobalEUsuario(categoria.Id, usuarioId);

      if (!dto.OrcamentoMensal.HasValue)
      {
        if (overrideAtual is not null)
        {
          categoriaOrcamentoUsuarioRepository.Remover(overrideAtual);
        }

        return;
      }

      if (overrideAtual is null)
      {
        categoriaOrcamentoUsuarioRepository.Salvar(
          new CategoriaOrcamentoUsuario(categoria.Id, usuarioId, dto.OrcamentoMensal.Value));
      }
      else
      {
        overrideAtual.AtualizarOrcamento(dto.OrcamentoMensal.Value);
        categoriaOrcamentoUsuarioRepository.Salvar(overrideAtual);
      }

      return;
    }

    categoria.Atualizar(dto.Nome, dto.Icone, dto.Cor);
    categoria.AtualizarOrcamentoMensal(dto.OrcamentoMensal);
    categoriaRepository.Atualizar(categoria);
  }
}