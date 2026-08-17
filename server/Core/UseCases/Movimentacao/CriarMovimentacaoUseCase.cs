using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CriarMovimentacaoUseCase(IMovimentacaoRepository _movimentacaoRepository, ICartaoRepository _cartaoRepository)
{
    public Guid Executar(Movimentacao movimentacao)
    {
        if (movimentacao.Fixa)
        {
            if (movimentacao.Periodo <= 0)
            {
                throw new ArgumentException("O período deve ser maior que zero para movimentações fixas.");
            }

            var grupoRecorrenciaId = Guid.NewGuid();

            // Compra no cartao: cada ocorrencia (parcela ou recorrente fixa)
            // precisa da propria competencia, calculada em cima da SUA data -
            // nao dá pra copiar a competencia da 1a ocorrencia pra todas,
            // senao parcelas futuras somam na fatura errada (a da 1a parcela).
            var cartao = movimentacao.CartaoId.HasValue
                ? _cartaoRepository.ObterPorId(movimentacao.CartaoId.Value, movimentacao.UsuarioId)
                : null;

            for (int i = 0; i < movimentacao.Periodo; i++)
            {
                var dataDaParcela = movimentacao.TipoRecorrencia == TipoRecorrencia.Semanal
                    ? movimentacao.Data.AddDays(7 * i)
                    : movimentacao.Data.AddMonths(i);

                var tituloOcorrencia = movimentacao.TipoMovimentacaoFixa == TipoMovimentacaoFixa.Parcelada
                    ? $"{movimentacao.Titulo} {i + 1}/{movimentacao.Periodo}"
                    : movimentacao.Titulo;

                var competenciaOcorrencia = cartao is not null
                    ? CompetenciaFaturaCalculator.CalcularCompetencia(dataDaParcela, cartao.DiaFechamento)
                    : (int?)null;

                Movimentacao novaOcorrencia = movimentacao.ClonarComNovaData(
                    dataDaParcela, grupoRecorrenciaId, tituloOcorrencia, competenciaOcorrencia);

                _movimentacaoRepository.Adicionar(novaOcorrencia);
            }
            return grupoRecorrenciaId;
        }

        return _movimentacaoRepository.Adicionar(movimentacao);
    }
}