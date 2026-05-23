using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterInvestimentoPorIdUseCase(IInvestimentoRepository _investimentoRepository)
{
    public Investimento? Executar(Guid id)
    {
        return _investimentoRepository.ObterPorId(id);
    }
}