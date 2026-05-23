using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;

namespace Finance.Infrastructure.Repositories;

public class MetaRepository(FinanceDbContext _context) : IMetaRepository
{
  public Guid Adicionar(Meta meta)
  {
    _context.Metas.Add(meta);
    _context.SaveChanges();
    return meta.Id;
  }

  public IEnumerable<Meta> ListarTodas()
      => _context.Metas
          .OrderBy(m => m.Concluida)
          .ThenBy(m => m.DataCriacao)
          .ToList();

  public Meta? BuscarPorId(Guid id)
      => _context.Metas.Find(id);

  public void Atualizar(Meta meta)
  {
    _context.Metas.Update(meta);
    _context.SaveChanges();
  }

  public void Remover(Guid id)
  {
    var meta = _context.Metas.Find(id);
    if (meta is null) return;

    _context.Metas.Remove(meta);
    _context.SaveChanges();
  }
}