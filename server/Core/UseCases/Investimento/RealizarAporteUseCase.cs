using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.Services;

namespace Finance.Core.UseCases;

public class RealizarAporteUseCase(
    IInvestimentoRepository _investimentoRepository,
    IMovimentacaoRepository _movimentacaoRepository,
    ITransactionManager _transactionManager)
{
    public void Executar(Guid usuarioId, Guid investimentoId, OperacaoInvestimentoDTO dto)
    {
        var investimento = _investimentoRepository.ObterPorId(investimentoId);
        if (investimento == null)
        {
            throw new Exception("Investimento não encontrado.");
        }

        investimento.AdicionarAporte(dto.Valor, dto.Data);

        var tituloMovimentacao = $"Novo Aporte: {investimento.Nome}";
        var saida = new Saida(tituloMovimentacao, $"Aporte realizado na corretora {investimento.Instituicao}", dto.Valor, dto.Data, usuarioId, false, 0, TipoRecorrencia.Mensal, null, investimento.Id);

        _transactionManager.Execute(() =>
        {
            _investimentoRepository.Atualizar(investimento);
            _movimentacaoRepository.Adicionar(saida);
        });
    }
}