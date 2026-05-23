using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface IInvestimentoRepository
{
    void Adicionar(Investimento investimento);
    void Atualizar(Investimento investimento);
    void Remover(Investimento investimento);

    Investimento? ObterPorId(Guid id);
    
    IEnumerable<Investimento> ObterTodos();
    
    IEnumerable<Investimento> ObterAtivos();
}