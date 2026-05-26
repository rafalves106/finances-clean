using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class CriarMovimentacaoUseCase(IMovimentacaoRepository _movimentacaoRepository)
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

            for (int i = 0; i < movimentacao.Periodo; i++)
            {
                var dataDaParcela = movimentacao.TipoRecorrencia == TipoRecorrencia.Semanal
                    ? movimentacao.Data.AddDays(7 * i)
                    : movimentacao.Data.AddMonths(i);

                var tituloOcorrencia = movimentacao.TipoMovimentacaoFixa == TipoMovimentacaoFixa.Parcelada
                    ? $"{movimentacao.Titulo} {i + 1}/{movimentacao.Periodo}"
                    : movimentacao.Titulo;

                Movimentacao novaOcorrencia = movimentacao.ClonarComNovaData(dataDaParcela, grupoRecorrenciaId, tituloOcorrencia);

                _movimentacaoRepository.Adicionar(novaOcorrencia);
            }
            return grupoRecorrenciaId;
        }

        return _movimentacaoRepository.Adicionar(movimentacao);
    }
}