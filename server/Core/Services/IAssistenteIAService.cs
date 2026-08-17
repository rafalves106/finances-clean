namespace Finance.Core.Services;

public record CategoriaResumoIA(Guid Id, string Nome);

public record InterpretacaoMovimentacaoResultado(
  bool Entendido,
  string? Titulo,
  decimal? Valor,
  DateTime? Data,
  string? Tipo,
  Guid? CategoriaId,
  string? Observacao
);

public interface IAssistenteIAService
{
  Task<InterpretacaoMovimentacaoResultado> InterpretarMovimentacao(
    string texto, DateTime dataReferencia, IReadOnlyList<CategoriaResumoIA> categorias);
}
