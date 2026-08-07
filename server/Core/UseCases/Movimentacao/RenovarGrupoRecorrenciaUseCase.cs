using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RenovarGrupoRecorrenciaUseCase(IMovimentacaoRepository movimentacaoRepository, RenumerarGrupoUseCase renumerarGrupoUseCase, ICartaoRepository cartaoRepository)
{
  public RenovacaoGrupoResultado Executar(Guid grupoRecorrenciaId, Guid usuarioId, int meses)
  {
    if (meses <= 0)
      throw new ArgumentException("A quantidade de meses deve ser maior que zero.");

    var movimentacoesDoGrupo = movimentacaoRepository
        .ListarPorGrupoRecorrencia(grupoRecorrenciaId, usuarioId)
        .OrderBy(m => m.Data)
        .ThenBy(m => m.Id)
        .ToList();

    if (movimentacoesDoGrupo.Count == 0)
      throw new KeyNotFoundException("Grupo de recorrência não encontrado.");

    var ultimaOcorrencia = movimentacoesDoGrupo[^1];

    // Mesmo problema do CriarMovimentacaoUseCase: se o grupo e vinculado a
    // cartao, cada ocorrencia renovada precisa da propria competencia
    // (baseada na sua data), nao a competencia congelada da ultima ocorrencia
    // existente.
    var cartao = ultimaOcorrencia.CartaoId.HasValue
        ? cartaoRepository.ObterPorId(ultimaOcorrencia.CartaoId.Value, usuarioId)
        : null;

    for (int i = 1; i <= meses; i++)
    {
      var novaData = ultimaOcorrencia.TipoRecorrencia == TipoRecorrencia.Semanal
          ? ultimaOcorrencia.Data.AddDays(7 * i)
          : ultimaOcorrencia.Data.AddMonths(i);

      var competenciaOcorrencia = cartao is not null
          ? CompetenciaFaturaCalculator.CalcularCompetencia(novaData, cartao.DiaFechamento)
          : (int?)null;

      var novaOcorrencia = ultimaOcorrencia.ClonarComNovaData(
          novaData, grupoRecorrenciaId, ultimaOcorrencia.Titulo, competenciaOcorrencia);
      movimentacaoRepository.Adicionar(novaOcorrencia);
    }

    if (ultimaOcorrencia.TipoMovimentacaoFixa == TipoMovimentacaoFixa.Parcelada)
    {
      renumerarGrupoUseCase.Executar(grupoRecorrenciaId, usuarioId);
    }

    var novaUltimaData = ultimaOcorrencia.TipoRecorrencia == TipoRecorrencia.Semanal
        ? ultimaOcorrencia.Data.AddDays(7 * meses)
        : ultimaOcorrencia.Data.AddMonths(meses);

    return new RenovacaoGrupoResultado(grupoRecorrenciaId, meses, novaUltimaData);
  }
}
