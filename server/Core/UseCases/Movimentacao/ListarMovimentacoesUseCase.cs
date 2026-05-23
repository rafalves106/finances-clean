using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarMovimentacoesUseCase(IMovimentacaoRepository _movimentacaoRepository)
{
    public IEnumerable<Movimentacao> Executar(int? mes = null, int? ano = null)
    {
        return _movimentacaoRepository.ListarTodas(mes, ano);
    }
}