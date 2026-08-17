using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

// A projeção não simula nada: só soma, mês a mês, movimentações que já
// existem no banco (parcelas/recorrências já materializadas na criação -
// ver CriarMovimentacaoUseCase) a partir do saldo acumulado até o mês
// inicial.
public class ObterProjecaoSaldoUseCaseTests
{
  [Fact]
  public void Executar_SomaMesesFuturosJaMaterializados_AcumulaAPartirDoSaldoAnterior()
  {
    var usuarioId = Guid.NewGuid();
    var movimentacoes = new Movimentacao[]
    {
      // antes do periodo projetado - só entra no saldo acumulado inicial
      new Entrada("Salário julho", null, 5000m, new DateTime(2026, 7, 5), usuarioId),

      // mês inicial (agosto): +3000 -1000 = saldo do mês 2000
      new Entrada("Salário", null, 3000m, new DateTime(2026, 8, 5), usuarioId),
      new Saida("Aluguel", "", 1000m, new DateTime(2026, 8, 10), usuarioId),

      // setembro: só saída de 300 (ex: parcela já materializada)
      new Saida("Notebook 2/10", "", 300m, new DateTime(2026, 9, 10), usuarioId),
    };

    var movRepo = new InMemoryMovimentacaoRepository(movimentacoes);
    var cartaoRepo = new InMemoryCartaoRepository(Array.Empty<CartaoManual>());
    var listarComCompetenciaEfetiva = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);
    var saldoAcumuladoUseCase = new ObterSaldoAcumuladoUseCase(movRepo, cartaoRepo);
    var useCase = new ObterProjecaoSaldoUseCase(listarComCompetenciaEfetiva, saldoAcumuladoUseCase);

    var projecao = useCase.Executar(usuarioId, 8, 2026, meses: 3).ToList();

    Assert.Equal(3, projecao.Count);

    // saldo acumulado antes de agosto = 5000 (só o salário de julho)
    var agosto = projecao[0];
    Assert.Equal(8, agosto.Mes);
    Assert.Equal(3000m, agosto.TotalEntradas);
    Assert.Equal(1000m, agosto.TotalSaidas);
    Assert.Equal(2000m, agosto.SaldoMes);
    Assert.Equal(7000m, agosto.SaldoAcumulado); // 5000 + 2000

    var setembro = projecao[1];
    Assert.Equal(9, setembro.Mes);
    Assert.Equal(0m, setembro.TotalEntradas);
    Assert.Equal(300m, setembro.TotalSaidas);
    Assert.Equal(-300m, setembro.SaldoMes);
    Assert.Equal(6700m, setembro.SaldoAcumulado); // 7000 - 300

    var outubro = projecao[2];
    Assert.Equal(10, outubro.Mes);
    Assert.Equal(0m, outubro.TotalEntradas);
    Assert.Equal(0m, outubro.TotalSaidas);
    Assert.Equal(6700m, outubro.SaldoAcumulado); // sem movimentação, saldo se mantém
  }

  [Fact]
  public void Executar_VirandoOAno_AvancaMesEAnoCorretamente()
  {
    var usuarioId = Guid.NewGuid();
    var movimentacoes = new Movimentacao[]
    {
      new Saida("Assinatura", "", 50m, new DateTime(2027, 1, 5), usuarioId),
    };

    var movRepo = new InMemoryMovimentacaoRepository(movimentacoes);
    var cartaoRepo = new InMemoryCartaoRepository(Array.Empty<CartaoManual>());
    var listarComCompetenciaEfetiva = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);
    var saldoAcumuladoUseCase = new ObterSaldoAcumuladoUseCase(movRepo, cartaoRepo);
    var useCase = new ObterProjecaoSaldoUseCase(listarComCompetenciaEfetiva, saldoAcumuladoUseCase);

    var projecao = useCase.Executar(usuarioId, 12, 2026, meses: 2).ToList();

    Assert.Equal(new[] { (12, 2026), (1, 2027) }, projecao.Select(p => (p.Mes, p.Ano)));
    Assert.Equal(-50m, projecao[1].SaldoMes);
  }

  [Theory]
  [InlineData(0, 6)]
  [InlineData(13, 6)]
  [InlineData(8, 0)]
  [InlineData(8, 13)]
  public void Executar_ParametrosForaDoIntervalo_Lanca(int mes, int meses)
  {
    var usuarioId = Guid.NewGuid();
    var movRepo = new InMemoryMovimentacaoRepository(Array.Empty<Movimentacao>());
    var cartaoRepo = new InMemoryCartaoRepository(Array.Empty<CartaoManual>());
    var listarComCompetenciaEfetiva = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);
    var saldoAcumuladoUseCase = new ObterSaldoAcumuladoUseCase(movRepo, cartaoRepo);
    var useCase = new ObterProjecaoSaldoUseCase(listarComCompetenciaEfetiva, saldoAcumuladoUseCase);

    Assert.Throws<ArgumentException>(() => useCase.Executar(usuarioId, mes, 2026, meses).ToList());
  }

  private sealed class InMemoryMovimentacaoRepository : IMovimentacaoRepository
  {
    private readonly List<Movimentacao> _dados;

    public InMemoryMovimentacaoRepository(IEnumerable<Movimentacao>? dadosIniciais = null)
    {
      _dados = dadosIniciais?.ToList() ?? new List<Movimentacao>();
    }

    public Guid Adicionar(Movimentacao movimentacao)
    {
      _dados.Add(movimentacao);
      return movimentacao.Id;
    }

    public IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null) => _dados;
    public IEnumerable<Movimentacao> ListarPorMes(int mes, int ano)
        => _dados.Where(m => m.Data.Month == mes && m.Data.Year == ano);
    public void Remover(Movimentacao movimentacao) => _dados.Remove(movimentacao);
    public void Atualizar(Movimentacao movimentacao) { }
    public Movimentacao? ObterPorId(Guid id) => _dados.FirstOrDefault(m => m.Id == id);
    public IEnumerable<Entrada> ListarEntradas() => _dados.OfType<Entrada>();
    public IEnumerable<Saida> ListarSaidas() => _dados.OfType<Saida>();
    public IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim)
        => _dados.Where(m => m.Data >= dataInicio && m.Data <= dataFim);
    public IEnumerable<Movimentacao> ListarPorPeriodoPorUsuario(DateTime dataInicio, DateTime dataFim, Guid usuarioId)
        => _dados.Where(m => m.UsuarioId == usuarioId && m.Data >= dataInicio && m.Data <= dataFim);
    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId)
        => _dados.Where(m => m.GrupoRecorrenciaId == grupoRecorrenciaId && m.UsuarioId == usuarioId);
    public IEnumerable<Movimentacao> ListarUltimaOcorrenciaDosGruposExpirados(Guid usuarioId, DateTime referencia)
        => Enumerable.Empty<Movimentacao>();
    public IEnumerable<Movimentacao> ListarPorCartaoECompetencia(Guid usuarioId, Guid cartaoId, int competencia)
        => _dados.Where(m => m.UsuarioId == usuarioId && m.CartaoId == cartaoId && m.CompetenciaFatura == competencia);
    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes) { }
    public void RemoverEmLote(IEnumerable<Movimentacao> movimentacoes) { }
  }

  private sealed class InMemoryCartaoRepository : ICartaoRepository
  {
    private readonly List<CartaoManual> _cartoes;

    public InMemoryCartaoRepository(IEnumerable<CartaoManual>? cartoes = null)
    {
      _cartoes = cartoes?.ToList() ?? new List<CartaoManual>();
    }

    public void Adicionar(CartaoManual cartao) => _cartoes.Add(cartao);
    public void Atualizar(CartaoManual cartao) { }
    public CartaoManual? ObterAtivoPorUsuario(Guid usuarioId)
        => _cartoes.FirstOrDefault(c => c.UsuarioId == usuarioId && c.Ativo);
    public CartaoManual? ObterPorId(Guid id, Guid usuarioId)
        => _cartoes.FirstOrDefault(c => c.Id == id && c.UsuarioId == usuarioId);
    public IReadOnlyCollection<CartaoManual> ListarPorUsuario(Guid usuarioId, bool incluirInativos = true)
        => _cartoes.Where(c => c.UsuarioId == usuarioId && (incluirInativos || c.Ativo)).ToList();
    public IReadOnlyCollection<CartaoManual> ListarAtivosPorUsuario(Guid usuarioId)
        => _cartoes.Where(c => c.UsuarioId == usuarioId && c.Ativo).ToList();
    public int ContarCartoesAtivos(Guid usuarioId, Guid? ignorarCartaoId = null)
        => _cartoes.Count(c => c.UsuarioId == usuarioId && c.Ativo && c.Id != ignorarCartaoId);
    public (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(Guid cartaoId, DateTime referenciaUtc, int diaFechamento)
        => (0m, 0m);
    public decimal ObterFaturaPorCompetencia(Guid cartaoId, int competencia) => 0m;
  }
}
