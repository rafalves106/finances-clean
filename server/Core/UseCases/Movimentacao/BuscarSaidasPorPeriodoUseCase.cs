using Finance.Core.Repositories;
using Finance.Core.Domain;

namespace Finance.Core.UseCases;

public class BuscarSaidasPorPeriodoUseCase(IMovimentacaoRepository movimentacaoRepository)
{
    public IEnumerable<Saida> Executar(DateTime dataInicio, DateTime dataFim)
    {
        return movimentacaoRepository.ListarPorPeriodo(dataInicio, dataFim)
            .OfType<Saida>();
    }
}