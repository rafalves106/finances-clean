namespace Finance.Core.Services;

public record CategoriaResumoIA(Guid Id, string Nome);

public record InterpretacaoMovimentacaoResultado(
  bool Entendido,
  string? Titulo,
  decimal? Valor,
  DateTime? Data,
  string? Tipo,
  Guid? CategoriaId,
  string? Observacao,
  bool Fixa = false,
  int? Periodo = null,
  string? TipoRecorrencia = null,
  string? TipoMovimentacaoFixa = null,
  string Intent = "Criar",
  string? FiltroTermoBusca = null,
  string? FiltroTipo = null,
  int? FiltroMes = null,
  int? FiltroAno = null
);

public interface IAssistenteIAService
{
  Task<InterpretacaoMovimentacaoResultado> InterpretarMovimentacao(
    string texto, DateTime dataReferencia, IReadOnlyList<CategoriaResumoIA> categorias);
}
