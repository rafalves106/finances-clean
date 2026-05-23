using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RemoverInvestimentoUseCase(
    IInvestimentoRepository _investimentoRepository,
    IMovimentacaoRepository _movimentacaoRepository)
{
    public void Executar(Guid usuarioId, Guid id)
    {
        var investimento = _investimentoRepository.ObterPorId(id);

        if (investimento == null)
        {
            throw new Exception("Investimento não encontrado.");
        }

        if (investimento.SaldoAtual > 0)
        {
            var tituloEstorno = $"Estorno: {investimento.Nome}";
            var descricaoEstorno = $"Valor retornado devido à exclusão do investimento {investimento.Nome} da instituição {investimento.Instituicao}.";

            var estorno = new Entrada(
                tituloEstorno,
                descricaoEstorno,
                investimento.SaldoAtual,
                DateTime.Now,
                usuarioId,
                false,
                0,
                    TipoRecorrencia.Mensal,
                null,
                investimento.Id
            );

            _movimentacaoRepository.Adicionar(estorno);
        }

        _investimentoRepository.Remover(investimento);
    }
}