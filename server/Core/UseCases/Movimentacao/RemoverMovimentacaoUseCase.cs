using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RemoverMovimentacaoUseCase(IMovimentacaoRepository _movimentacaoRepository)
{
    public void Executar(Guid id)
    {
        var movimentacao = _movimentacaoRepository.ObterPorId(id);

        if (movimentacao == null)
        {
            throw new Exception("Movimentação não encontrada.");
        }

        if (movimentacao.InvestimentoId.HasValue)
        {
            throw new InvalidOperationException("Esta movimentação é gerenciada pelo módulo de Investimentos e não pode ser excluída manualmente. Exclua o investimento correspondente.");
        }

        _movimentacaoRepository.Remover(movimentacao);
    }
}