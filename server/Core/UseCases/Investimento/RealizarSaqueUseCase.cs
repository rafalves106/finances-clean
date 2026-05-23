using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RealizarSaqueUseCase(
    IInvestimentoRepository _investimentoRepository,
    IMovimentacaoRepository _movimentacaoRepository)
{
    public void Executar(Guid usuarioId, Guid investimentoId, OperacaoInvestimentoDTO dto)
    {
        var investimento = _investimentoRepository.ObterPorId(investimentoId);
        if (investimento == null)
        {
            throw new Exception("Investimento não encontrado.");
        }

        investimento.RegistrarSaque(dto.Valor, dto.Data);

        var tituloMovimentacao = $"Resgate: {investimento.Nome}";
        var entrada = new Entrada(tituloMovimentacao, $"Valor resgatado da instituição {investimento.Instituicao}", dto.Valor, dto.Data, usuarioId, false, 0, TipoRecorrencia.Mensal, null, investimento.Id);

        _investimentoRepository.Atualizar(investimento);
        _movimentacaoRepository.Adicionar(entrada);
    }
}