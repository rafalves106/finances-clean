using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Finance.Infrastructure.Repositories;

public class CategoriaRepository(FinanceDbContext _context) : ICategoriaRepository
{
  public Guid Adicionar(Categoria categoria)
  {
    _context.Categorias.Add(categoria);
    _context.SaveChanges();
    return categoria.Id;
  }

  public IEnumerable<Categoria> ListarTodas()
      => _context.Categorias
          .OrderBy(c => c.Nome)
          .ToList();

  public Categoria? BuscarPorId(Guid id)
      => _context.Categorias.Find(id);

  public IDictionary<Guid, decimal> ListarOrcamentosMensaisCategoriasGlobais(Guid usuarioId, IEnumerable<Guid> categoriasGlobaisIds)
  {
    var categoriasIds = categoriasGlobaisIds.Distinct().ToList();
    if (categoriasIds.Count == 0)
    {
      return new Dictionary<Guid, decimal>();
    }

    return _context.CategoriasOrcamentosUsuarios
      .AsNoTracking()
      .Where(o => o.UsuarioId == usuarioId && categoriasIds.Contains(o.CategoriaGlobalId))
      .ToDictionary(o => o.CategoriaGlobalId, o => o.OrcamentoMensal);
  }

  public void Atualizar(Categoria categoria)
  {
    _context.Categorias.Update(categoria);
    _context.SaveChanges();
  }

  public void Remover(Guid id)
  {
    var categoria = _context.Categorias.Find(id);
    if (categoria is null) return;

    _context.Categorias.Remove(categoria);
    _context.SaveChanges();
  }
}