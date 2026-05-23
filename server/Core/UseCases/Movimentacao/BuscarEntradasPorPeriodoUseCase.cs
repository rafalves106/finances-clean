using Finance.Core.Repositories;
using Finance.Core.Domain;

namespace Finance.Core.UseCases;

public class BuscarEntradasPorPeriodoUseCase(IMovimentacaoRepository movimentacaoRepository)
{
    public IEnumerable<Entrada> Executar(DateTime dataInicio, DateTime dataFim)
    {
        return movimentacaoRepository.ListarPorPeriodo(dataInicio, dataFim)
            .OfType<Entrada>();
    }
}