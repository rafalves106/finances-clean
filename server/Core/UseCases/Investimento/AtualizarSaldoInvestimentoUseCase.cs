using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class AtualizarSaldoInvestimentoUseCase(IInvestimentoRepository _investimentoRepository)
{
    public void Executar(Guid investimentoId, decimal novoSaldoAtual, DateTime dataAtualizacao)
    {
        var investimento = _investimentoRepository.ObterPorId(investimentoId);
        
        if (investimento == null)
        {
            throw new Exception("Investimento não encontrado.");
        }

        investimento.AtualizarSaldo(novoSaldoAtual, dataAtualizacao);

        _investimentoRepository.Atualizar(investimento);
    }
}