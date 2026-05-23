using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;

namespace Finance.Infrastructure.Repositories;

public class VeiculoRepository(FinanceDbContext _context) : IVeiculoRepository
{
  public Guid Adicionar(Veiculo veiculo)
  {
    _context.Veiculos.Add(veiculo);
    _context.SaveChanges();
    return veiculo.Id;
  }

  public IEnumerable<Veiculo> ListarTodos()
      => _context.Veiculos
          .OrderBy(v => v.Nome)
          .ToList();

  public Veiculo? BuscarPorId(Guid id)
      => _context.Veiculos.FirstOrDefault(v => v.Id == id);

  public void Atualizar(Veiculo veiculo)
  {
    _context.Veiculos.Update(veiculo);
    _context.SaveChanges();
  }

  public void Remover(Guid id)
  {
    var veiculo = _context.Veiculos.Find(id);
    if (veiculo is null)
      throw new KeyNotFoundException($"Veículo com ID {id} não encontrado.");

    _context.Veiculos.Remove(veiculo);
    _context.SaveChanges();
  }
}
