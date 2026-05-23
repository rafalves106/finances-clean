using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CriarInvestimentoUseCase(
    IInvestimentoRepository _investimentoRepository,
    IMovimentacaoRepository _movimentacaoRepository)
{
    public Guid Executar(Guid usuarioId, CriarInvestimentoDTO dto)
    {
        var investimento = new Investimento(
            dto.Nome, dto.Instituicao, dto.Tipo, dto.ValorAplicado,
            dto.DataInicio, usuarioId, dto.TipoRentabilidade, dto.Liquidez,
            dto.DataVencimento, dto.TaxaRendimento
        );

        var tituloMovimentacao = $"Aplicação inicial: {investimento.Nome}";
        var descricaoMovimentacao = $"Transferência para instituição: {investimento.Instituicao}";

        var saida = new Saida(tituloMovimentacao, descricaoMovimentacao, dto.ValorAplicado, dto.DataInicio, usuarioId, false, 0, TipoRecorrencia.Mensal, null, investimento.Id);

        _investimentoRepository.Adicionar(investimento);
        _movimentacaoRepository.Adicionar(saida);

        return investimento.Id;
    }
}