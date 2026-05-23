using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ListarInvestimentosUseCase(IInvestimentoRepository _investimentoRepository)
{
    public IEnumerable<Investimento> Executar(bool mostrarInativos = false)
    {
        if (mostrarInativos)
        {
            return _investimentoRepository.ObterTodos();
        }
        
        return _investimentoRepository.ObterAtivos();
    }
}