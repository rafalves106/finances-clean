using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class BuscarSaidaUseCase(IMovimentacaoRepository _movimentacaoRepository)
{
    public IEnumerable<Saida> Executar()
    {
        return _movimentacaoRepository.ListarSaidas();
    }
}