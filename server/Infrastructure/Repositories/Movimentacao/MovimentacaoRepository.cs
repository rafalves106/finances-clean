using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Finance.Infrastructure.Repositories;

public class MovimentacaoRepository : IMovimentacaoRepository
{
    private readonly FinanceDbContext _context;

    public MovimentacaoRepository(FinanceDbContext context)
    {
        _context = context;
    }

    public Guid Adicionar(Movimentacao movimentacao)
    {
        _context.Movimentacoes.Add(movimentacao);
        _context.SaveChanges();
        return movimentacao.Id;
    }

    public IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null)
    {
        var query = _context.Movimentacoes
            .Include(m => m.Categoria)
            .AsQueryable();

        if (mes.HasValue)
        {
            query = query.Where(m => m.Data.Month == mes.Value);
        }

        if (ano.HasValue)
        {
            query = query.Where(m => m.Data.Year == ano.Value);
        }

        return query
            .OrderByDescending(m => m.Data)
            .ToList();
    }

    public IEnumerable<Movimentacao> ListarPorMes(int mes, int ano)
    {
        return _context.Movimentacoes
            .Include(m => m.Categoria)
            .Where(m => m.Data.Month == mes && m.Data.Year == ano)
            .OrderByDescending(m => m.Data)
            .ToList();
    }

    public void Remover(Movimentacao movimentacao)
    {
        _context.Movimentacoes.Remove(movimentacao);
        _context.SaveChanges();
    }

    public void Atualizar(Movimentacao movimentacao)
    {
        _context.Movimentacoes.Update(movimentacao);
        _context.SaveChanges();
    }

    public Movimentacao? ObterPorId(Guid id)
    {
        return _context.Movimentacoes
            .Include(m => m.Categoria)
            .FirstOrDefault(m => m.Id == id);
    }


    public IEnumerable<Entrada> ListarEntradas()
    {
        return _context.Movimentacoes.OfType<Entrada>().ToList();
    }

    public IEnumerable<Saida> ListarSaidas()
    {
        return _context.Movimentacoes.OfType<Saida>().ToList();
    }

    public IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim)
    {
        return _context.Movimentacoes
            .Include(m => m.Categoria)
            .Where(m => m.Data >= dataInicio && m.Data <= dataFim)
            .ToList();
    }

    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId)
    {
        return _context.Movimentacoes
            .Include(m => m.Categoria)
            .Where(m => m.GrupoRecorrenciaId == grupoRecorrenciaId && m.UsuarioId == usuarioId)
            .OrderBy(m => m.Data)
            .ThenBy(m => m.Id)
            .ToList();
    }

    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes)
    {
        _context.Movimentacoes.UpdateRange(movimentacoes);
        _context.SaveChanges();
    }

    public decimal ObterSaldoAcumulado(int mes, int ano)
    {
        var baseQuery = _context.Movimentacoes
            .Where(m => m.InvestimentoId == null &&
                    (m.Data.Year < ano ||
                    (m.Data.Year == ano && m.Data.Month < mes)));

        var entradas = baseQuery.OfType<Entrada>().Sum(m => (decimal?)m.Valor) ?? 0;
        var saidas = baseQuery.OfType<Saida>().Sum(m => (decimal?)m.Valor) ?? 0;

        return entradas - saidas;
    }
}