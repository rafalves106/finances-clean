using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class BuscarEntradaUseCase(IMovimentacaoRepository _movimentacaoRepository)
{
    public IEnumerable<Entrada> Executar()
    {
        return _movimentacaoRepository.ListarEntradas();
    }
}