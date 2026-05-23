using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CriarMovimentacaoUseCase(IMovimentacaoRepository _movimentacaoRepository)
{
    public Guid Executar(Movimentacao movimentacao)
    {
        if (movimentacao.Fixa)
        {
            var grupoRecorrenciaId = Guid.NewGuid();

            for (int i = 0; i < movimentacao.Periodo; i++)
            {
                var dataDaParcela = movimentacao.TipoRecorrencia == TipoRecorrencia.Semanal
                    ? movimentacao.Data.AddDays(7 * i)
                    : movimentacao.Data.AddMonths(i);

                Movimentacao novaOcorrencia = movimentacao.ClonarComNovaData(dataDaParcela, grupoRecorrenciaId);

                _movimentacaoRepository.Adicionar(novaOcorrencia);
            }
            return grupoRecorrenciaId;
        }

        return _movimentacaoRepository.Adicionar(movimentacao);
    }
}