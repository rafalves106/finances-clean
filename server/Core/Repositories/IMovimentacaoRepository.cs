using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface IMovimentacaoRepository
{
    Guid Adicionar(Movimentacao movimentacao);
    IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null);
    IEnumerable<Movimentacao> ListarPorMes(int mes, int ano);
    void Remover(Movimentacao movimentacao);
    void Atualizar(Movimentacao movimentacao);
    Movimentacao? ObterPorId(Guid id);
    IEnumerable<Entrada> ListarEntradas();
    IEnumerable<Saida> ListarSaidas();
    IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim);
    decimal ObterSaldoAcumulado(int mes, int ano);
}