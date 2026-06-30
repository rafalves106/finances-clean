using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface IMovimentacaoRepository
{
    Guid Adicionar(Movimentacao movimentacao);
    IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null);
    IEnumerable<Movimentacao> ListarPorMes(int mes, int ano);
    void Remover(Movimentacao movimentacao);
    void Atualizar(Movimentacao movimentacao);
    Movimentacao? ObterPorId(Guid id);
    IEnumerable<Entrada> ListarEntradas();
    IEnumerable<Saida> ListarSaidas();
    IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim);
    IEnumerable<Movimentacao> ListarPorPeriodoPorUsuario(DateTime dataInicio, DateTime dataFim, Guid usuarioId);
    IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId);
    void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes);
    decimal ObterSaldoAcumulado(int mes, int ano);
    decimal SomarComprasCartaoPorCiclo(Guid usuarioId, Guid cartaoId, int ciclo) => 0m;
    int VincularComprasCartaoAFatura(Guid usuarioId, Guid cartaoId, int ciclo, Guid faturaAgregadaId) => 0;
    IEnumerable<Saida> ListarComprasCartaoPorPeriodoSemFatura(Guid usuarioId, DateTime dataInicio, DateTime dataFim) => [];
    Saida? ObterMovimentacaoFatura(Guid usuarioId, Guid faturaAgregadaId) => null;
}