using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class BuscarMovimentacaoUseCase(IMovimentacaoRepository _movimentacaoRepository)
{
    public Movimentacao? Executar(Guid id)
    {
        return _movimentacaoRepository.ObterPorId(id);
    }
}