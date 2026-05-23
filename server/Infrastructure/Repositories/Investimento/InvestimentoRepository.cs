using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Finance.Infrastructure.Repositories;

public class InvestimentoRepository : IInvestimentoRepository
{
    private readonly FinanceDbContext _context;

    public InvestimentoRepository(FinanceDbContext context)
    {
        _context = context;
    }

    public void Adicionar(Investimento investimento)
    {
        _context.Investimentos.Add(investimento);
        _context.SaveChanges();
    }

    public void Atualizar(Investimento investimento)
    {
        _context.Investimentos.Update(investimento);
        _context.SaveChanges();
    }

    public void Remover(Investimento investimento)
    {
        _context.Investimentos.Remove(investimento);
        _context.SaveChanges();
    }

    public Investimento? ObterPorId(Guid id)
    {
        return _context.Investimentos
            .Include(i => i.Transacoes) 
            .FirstOrDefault(i => i.Id == id);
    }

    public IEnumerable<Investimento> ObterTodos()
    {
        return _context.Investimentos
            .Include(i => i.Transacoes)
            .OrderByDescending(i => i.DataInicio)
            .ToList();
    }

    public IEnumerable<Investimento> ObterAtivos()
    {
        return _context.Investimentos
            .Include(i => i.Transacoes)
            .Where(i => i.Ativo)
            .OrderByDescending(i => i.DataInicio)
            .ToList();
    }
}