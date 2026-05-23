using Finance.Core.Repositories;
using Finance.Core.Domain;

namespace Finance.Core.UseCases;

public class BuscarMovimentacoesPorPeriodoUseCase(IMovimentacaoRepository movimentacaoRepository)
{
    public IEnumerable<Movimentacao> Executar(DateTime dataInicio, DateTime dataFim)
    {
        return movimentacaoRepository.ListarPorPeriodo(dataInicio, dataFim);
    }
}