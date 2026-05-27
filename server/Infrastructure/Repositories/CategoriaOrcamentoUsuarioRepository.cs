using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Finance.Infrastructure.Repositories;

public class CategoriaOrcamentoUsuarioRepository(FinanceDbContext context) : ICategoriaOrcamentoUsuarioRepository
{
  public CategoriaOrcamentoUsuario? BuscarPorCategoriaGlobalEUsuario(Guid categoriaGlobalId, Guid usuarioId)
  {
    return context.CategoriasOrcamentosUsuarios
      .FirstOrDefault(item => item.CategoriaGlobalId == categoriaGlobalId && item.UsuarioId == usuarioId);
  }

  public void Salvar(CategoriaOrcamentoUsuario categoriaOrcamentoUsuario)
  {
    var trackedEntity = context.CategoriasOrcamentosUsuarios
      .Local
      .FirstOrDefault(item => item.Id == categoriaOrcamentoUsuario.Id);

    if (trackedEntity is null)
    {
      var exists = context.CategoriasOrcamentosUsuarios
        .AsNoTracking()
        .Any(item => item.Id == categoriaOrcamentoUsuario.Id);

      if (exists)
      {
        context.CategoriasOrcamentosUsuarios.Update(categoriaOrcamentoUsuario);
      }
      else
      {
        context.CategoriasOrcamentosUsuarios.Add(categoriaOrcamentoUsuario);
      }
    }

    context.SaveChanges();
  }

  public void Remover(CategoriaOrcamentoUsuario categoriaOrcamentoUsuario)
  {
    context.CategoriasOrcamentosUsuarios.Remove(categoriaOrcamentoUsuario);
    context.SaveChanges();
  }
}