using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class FaturaAgregadaCartaoUseCasesTests
{
  [Fact]
  public void CT01_DeveCriarMovimentacaoAgregadaUnicaComSomaDoCiclo()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Casa", 4000m, 10, 20);
    var repos = CriarRepositorios(cartao);
    var ciclo = CompetenciaFaturaCalculator.CalcularCompetencia(new DateTime(2026, 6, 11, 0, 0, 0, DateTimeKind.Utc), cartao.DiaFechamento);

    repos.Movimentacoes.Adicionar(new Saida("Compra 1", "", 120m, new DateTime(2026, 6, 11, 0, 0, 0, DateTimeKind.Utc), usuarioId, cartaoId: cartao.Id, competenciaFatura: ciclo));
    repos.Movimentacoes.Adicionar(new Saida("Compra 2", "", 80m, new DateTime(2026, 6, 12, 0, 0, 0, DateTimeKind.Utc), usuarioId, cartaoId: cartao.Id, competenciaFatura: ciclo));

    var fatura = repos.FaturasService.RecalcularSync(usuarioId, cartao.Id, ciclo, "criar");
    var movFatura = repos.MovimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, fatura);

    Assert.Equal(200m, movFatura.Valor);
    Assert.Equal(new DateTime(2026, 7, 20, 0, 0, 0, DateTimeKind.Utc), movFatura.Data);
    Assert.True(movFatura.EhMovimentacaoFatura);
    Assert.Single(repos.Movimentacoes.ListarSaidas(), s => s.EhMovimentacaoFatura && s.FaturaAgregadaId == fatura.Id);
  }

  [Fact]
  public void CT04_EditarCompra_DeveRecalcularMovimentacaoAgregada()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Casa", 4000m, 10, 20);
    var repos = CriarRepositorios(cartao);
    var compraData = new DateTime(2026, 6, 12, 0, 0, 0, DateTimeKind.Utc);
    var ciclo = CompetenciaFaturaCalculator.CalcularCompetencia(compraData, cartao.DiaFechamento);

    var compra = new Saida("Compra", "", 100m, compraData, usuarioId, cartaoId: cartao.Id, competenciaFatura: ciclo);
    repos.Movimentacoes.Adicionar(compra);

    var faturaInicial = repos.FaturasService.RecalcularSync(usuarioId, cartao.Id, ciclo, "criar");
    repos.MovimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, faturaInicial);

    compra.AtualizarDados("Compra", "", 180m, compraData, false, 0, cartaoId: cartao.Id, competenciaFatura: ciclo);
    repos.Movimentacoes.Atualizar(compra);

    var faturaAtualizada = repos.FaturasService.RecalcularSync(usuarioId, cartao.Id, ciclo, "editar");
    var movFatura = repos.MovimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, faturaAtualizada);

    Assert.Equal(180m, movFatura.Valor);
  }

  [Fact]
  public void CT05eCT09_ExcluirCompraETotalZero_DeveManterMovimentacaoZerada()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Casa", 4000m, 10, 20);
    var repos = CriarRepositorios(cartao);
    var compraData = new DateTime(2026, 6, 12, 0, 0, 0, DateTimeKind.Utc);
    var ciclo = CompetenciaFaturaCalculator.CalcularCompetencia(compraData, cartao.DiaFechamento);

    var compra = new Saida("Compra", "", 90m, compraData, usuarioId, cartaoId: cartao.Id, competenciaFatura: ciclo);
    repos.Movimentacoes.Adicionar(compra);

    var faturaInicial = repos.FaturasService.RecalcularSync(usuarioId, cartao.Id, ciclo, "criar");
    repos.MovimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, faturaInicial);

    repos.Movimentacoes.Remover(compra);

    var faturaZerada = repos.FaturasService.RecalcularSync(usuarioId, cartao.Id, ciclo, "excluir");
    var movFatura = repos.MovimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, faturaZerada);

    Assert.Equal(0m, movFatura.Valor);
    Assert.True(movFatura.EhMovimentacaoFatura);
    Assert.NotNull(repos.Movimentacoes.ObterMovimentacaoFatura(usuarioId, faturaZerada.Id));
  }

  [Fact]
  public void CT11_AtualizacoesConcorrentes_NoMesmoCiclo_NaoDevemGerarDuplicidade()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Casa", 4000m, 10, 20);
    var repos = CriarRepositorios(cartao);
    var compraData = new DateTime(2026, 6, 12, 0, 0, 0, DateTimeKind.Utc);
    var ciclo = CompetenciaFaturaCalculator.CalcularCompetencia(compraData, cartao.DiaFechamento);

    var compraA = new Saida("Compra A", "", 100m, compraData, usuarioId, cartaoId: cartao.Id, competenciaFatura: ciclo);
    var compraB = new Saida("Compra B", "", 50m, compraData, usuarioId, cartaoId: cartao.Id, competenciaFatura: ciclo);
    repos.Movimentacoes.Adicionar(compraA);
    repos.Movimentacoes.Adicionar(compraB);

    var novosValores = new[] { 120m, 80m, 60m, 140m, 40m, 110m };
    Parallel.ForEach(novosValores, novoValor =>
    {
      lock (compraA)
      {
        compraA.AtualizarDados(compraA.Titulo, compraA.Descricao, novoValor, compraA.Data, compraA.Fixa, compraA.Periodo, compraA.CategoriaId, compraA.VeiculoId, compraA.Km, compraA.CartaoId, compraA.CompetenciaFatura, compraA.TipoMovimentacaoFixa);
        repos.Movimentacoes.Atualizar(compraA);
      }

      var fatura = repos.FaturasService.RecalcularSync(usuarioId, cartao.Id, ciclo, "editar");
      repos.MovimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, fatura);
    });

    var totalEsperado = repos.Movimentacoes.SomarComprasCartaoPorCiclo(usuarioId, cartao.Id, ciclo);
    var faturaFinal = repos.Faturas.ObterPorCartaoECiclo(usuarioId, cartao.Id, ciclo)!;
    var movFaturaFinal = repos.Movimentacoes.ObterMovimentacaoFatura(usuarioId, faturaFinal.Id)!;

    Assert.Equal(totalEsperado, movFaturaFinal.Valor);
    Assert.Single(repos.Movimentacoes.ListarSaidas(), s => s.EhMovimentacaoFatura && s.FaturaAgregadaId == faturaFinal.Id);
  }

  [Fact]
  public void BackfillIncremental12Meses_DeveMigrarSomenteJanelaRecente()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Casa", 4000m, 10, 20);
    var repos = CriarRepositorios(cartao);

    var recenteData = new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc);
    var antigoData = new DateTime(2024, 12, 5, 0, 0, 0, DateTimeKind.Utc);
    var cicloRecente = CompetenciaFaturaCalculator.CalcularCompetencia(recenteData, cartao.DiaFechamento);
    var cicloAntigo = CompetenciaFaturaCalculator.CalcularCompetencia(antigoData, cartao.DiaFechamento);

    var recente = new Saida("Recente", "", 70m, recenteData, usuarioId, cartaoId: cartao.Id, competenciaFatura: cicloRecente);
    var antigo = new Saida("Antigo", "", 40m, antigoData, usuarioId, cartaoId: cartao.Id, competenciaFatura: cicloAntigo);
    repos.Movimentacoes.Adicionar(recente);
    repos.Movimentacoes.Adicionar(antigo);

    var backfill = new ExecutarBackfillFaturaAgregadaUseCase(repos.Movimentacoes, repos.Cartoes, repos.FaturasService, repos.MovimentacaoFaturaService);
    backfill.Executar(usuarioId, meses: 12, referenciaUtc: new DateTime(2026, 6, 20, 0, 0, 0, DateTimeKind.Utc));

    Assert.NotNull(repos.Movimentacoes.ObterPorId(recente.Id));
    Assert.NotNull(repos.Movimentacoes.ObterPorId(antigo.Id));
    Assert.NotNull((repos.Movimentacoes.ObterPorId(recente.Id) as Saida)!.FaturaAgregadaId);
    Assert.Null((repos.Movimentacoes.ObterPorId(antigo.Id) as Saida)!.FaturaAgregadaId);
  }

  [Fact]
  public void FluxoNaoCartao_DevePermanecerSemRegressaoNoResumoMensal()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Casa", 4000m, 10, 20);
    var repos = CriarRepositorios(cartao);
    var data = new DateTime(2026, 7, 12, 0, 0, 0, DateTimeKind.Utc);
    var ciclo = CompetenciaFaturaCalculator.CalcularCompetencia(data, cartao.DiaFechamento);

    repos.Movimentacoes.Adicionar(new Entrada("Salário", "", 1000m, data, usuarioId));
    repos.Movimentacoes.Adicionar(new Saida("Mercado", "", 200m, data, usuarioId));
    repos.Movimentacoes.Adicionar(new Saida("Compra Cartão", "", 150m, data, usuarioId, cartaoId: cartao.Id, competenciaFatura: ciclo));

    var fatura = repos.FaturasService.RecalcularSync(usuarioId, cartao.Id, ciclo, "criar");
    repos.MovimentacaoFaturaService.CreateOrUpdateForFatura(usuarioId, fatura);

    var resumoUseCase = new ObterResumoMensalUseCase(repos.Movimentacoes);
    var resumo = resumoUseCase.Executar(7, 2026);

    Assert.Equal(1000m, resumo.TotalEntradas);
    Assert.Equal(200m, resumo.TotalSaidas);
  }

  private static ContextoTeste CriarRepositorios(CartaoManual cartao)
  {
    var cartoes = new InMemoryCartaoRepository();
    cartoes.Adicionar(cartao);

    var faturas = new InMemoryFaturaAgregadaRepository();
    var movimentacoes = new InMemoryMovimentacaoRepository();
    var faturasService = new FaturaAgregadaService(faturas, movimentacoes, cartoes);
    var movimentacaoFaturaService = new MovimentacaoFaturaService(movimentacoes, faturas, cartoes);

    return new ContextoTeste(cartoes, faturas, movimentacoes, faturasService, movimentacaoFaturaService);
  }

  private sealed record ContextoTeste(
    InMemoryCartaoRepository Cartoes,
    InMemoryFaturaAgregadaRepository Faturas,
    InMemoryMovimentacaoRepository Movimentacoes,
    FaturaAgregadaService FaturasService,
    MovimentacaoFaturaService MovimentacaoFaturaService);

  private sealed class InMemoryFaturaAgregadaRepository : IFaturaAgregadaRepository
  {
    private readonly List<FaturaAgregada> _faturas = [];

    public void Adicionar(FaturaAgregada faturaAgregada)
    {
      _faturas.Add(faturaAgregada);
    }

    public void Atualizar(FaturaAgregada faturaAgregada)
    {
      var index = _faturas.FindIndex(f => f.Id == faturaAgregada.Id);
      if (index >= 0)
      {
        _faturas[index] = faturaAgregada;
      }
    }

    public FaturaAgregada? ObterPorCartaoECiclo(Guid usuarioId, Guid cartaoId, int ciclo)
      => _faturas.FirstOrDefault(f => f.UsuarioId == usuarioId && f.CartaoId == cartaoId && f.Ciclo == ciclo);

    public IReadOnlyCollection<FaturaAgregada> ListarPorCartao(Guid usuarioId, Guid cartaoId)
      => _faturas.Where(f => f.UsuarioId == usuarioId && f.CartaoId == cartaoId).ToList();
  }

  private sealed class InMemoryCartaoRepository : ICartaoRepository
  {
    private readonly List<CartaoManual> _cartoes = [];

    public void Adicionar(CartaoManual cartao) => _cartoes.Add(cartao);

    public void Atualizar(CartaoManual cartao)
    {
      var index = _cartoes.FindIndex(c => c.Id == cartao.Id);
      if (index >= 0)
      {
        _cartoes[index] = cartao;
      }
    }

    public CartaoManual? ObterAtivoPorUsuario(Guid usuarioId)
      => _cartoes.FirstOrDefault(c => c.UsuarioId == usuarioId && c.Ativo);

    public CartaoManual? ObterPorId(Guid id, Guid usuarioId)
      => _cartoes.FirstOrDefault(c => c.Id == id && c.UsuarioId == usuarioId);

    public IReadOnlyCollection<CartaoManual> ListarPorUsuario(Guid usuarioId, bool incluirInativos = true)
      => _cartoes.Where(c => c.UsuarioId == usuarioId && (incluirInativos || c.Ativo)).ToList();

    public IReadOnlyCollection<CartaoManual> ListarAtivosPorUsuario(Guid usuarioId)
      => _cartoes.Where(c => c.UsuarioId == usuarioId && c.Ativo).ToList();

    public int ContarCartoesAtivos(Guid usuarioId, Guid? ignorarCartaoId = null)
      => _cartoes.Count(c => c.UsuarioId == usuarioId && c.Ativo && (!ignorarCartaoId.HasValue || c.Id != ignorarCartaoId.Value));

    public (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(Guid cartaoId, DateTime referenciaUtc, int diaFechamento)
      => (0m, 0m);
  }

  private sealed class InMemoryMovimentacaoRepository : IMovimentacaoRepository
  {
    private readonly List<Movimentacao> _movimentacoes = [];
    private readonly object _sync = new();

    public Guid Adicionar(Movimentacao movimentacao)
    {
      lock (_sync)
      {
        _movimentacoes.Add(movimentacao);
        return movimentacao.Id;
      }
    }

    public IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null)
    {
      IEnumerable<Movimentacao> query;
      lock (_sync)
      {
        query = _movimentacoes.ToList();
      }

      if (mes.HasValue)
      {
        query = query.Where(m => m.Data.Month == mes.Value);
      }

      if (ano.HasValue)
      {
        query = query.Where(m => m.Data.Year == ano.Value);
      }

      return query;
    }

    public IEnumerable<Movimentacao> ListarPorMes(int mes, int ano)
    {
      lock (_sync)
      {
        return _movimentacoes.Where(m => m.Data.Month == mes && m.Data.Year == ano).ToList();
      }
    }

    public void Remover(Movimentacao movimentacao)
    {
      lock (_sync)
      {
        _movimentacoes.Remove(movimentacao);
      }
    }

    public void Atualizar(Movimentacao movimentacao)
    {
      lock (_sync)
      {
        var index = _movimentacoes.FindIndex(m => m.Id == movimentacao.Id);
        if (index >= 0)
        {
          _movimentacoes[index] = movimentacao;
        }
      }
    }

    public Movimentacao? ObterPorId(Guid id)
    {
      lock (_sync)
      {
        return _movimentacoes.FirstOrDefault(m => m.Id == id);
      }
    }

    public IEnumerable<Entrada> ListarEntradas()
    {
      lock (_sync)
      {
        return _movimentacoes.OfType<Entrada>().ToList();
      }
    }

    public IEnumerable<Saida> ListarSaidas()
    {
      lock (_sync)
      {
        return _movimentacoes.OfType<Saida>().ToList();
      }
    }

    public IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim)
    {
      lock (_sync)
      {
        return _movimentacoes.Where(m => m.Data >= dataInicio && m.Data <= dataFim).ToList();
      }
    }

    public IEnumerable<Movimentacao> ListarPorPeriodoPorUsuario(DateTime dataInicio, DateTime dataFim, Guid usuarioId)
    {
      lock (_sync)
      {
        return _movimentacoes.Where(m => m.UsuarioId == usuarioId && m.Data >= dataInicio && m.Data <= dataFim).ToList();
      }
    }

    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId)
    {
      lock (_sync)
      {
        return _movimentacoes.Where(m => m.GrupoRecorrenciaId == grupoRecorrenciaId && m.UsuarioId == usuarioId).ToList();
      }
    }

    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes)
    {
      foreach (var item in movimentacoes)
      {
        Atualizar(item);
      }
    }

    public decimal ObterSaldoAcumulado(int mes, int ano)
    {
      List<Movimentacao> snapshot;
      lock (_sync)
      {
        snapshot = _movimentacoes.ToList();
      }

      var baseQuery = snapshot
        .Where(m => m.InvestimentoId == null)
        .Where(m => m.CartaoId == null || m.EhMovimentacaoFatura)
        .Where(m => m.Data.Year < ano || (m.Data.Year == ano && m.Data.Month < mes));

      var entradas = baseQuery.OfType<Entrada>().Sum(e => e.Valor);
      var saidas = baseQuery.OfType<Saida>().Sum(s => s.Valor);
      return entradas - saidas;
    }

    public decimal SomarComprasCartaoPorCiclo(Guid usuarioId, Guid cartaoId, int ciclo)
    {
      lock (_sync)
      {
        return _movimentacoes
          .OfType<Saida>()
          .Where(s => s.UsuarioId == usuarioId && s.CartaoId == cartaoId && s.CompetenciaFatura == ciclo && !s.EhMovimentacaoFatura)
          .Sum(s => s.Valor);
      }
    }

    public int VincularComprasCartaoAFatura(Guid usuarioId, Guid cartaoId, int ciclo, Guid faturaAgregadaId)
    {
      var total = 0;
      lock (_sync)
      {
        foreach (var compra in _movimentacoes
                   .OfType<Saida>()
                   .Where(s => s.UsuarioId == usuarioId && s.CartaoId == cartaoId && s.CompetenciaFatura == ciclo && !s.EhMovimentacaoFatura)
                   .ToList())
        {
          compra.AtualizarDados(
            compra.Titulo,
            compra.Descricao,
            compra.Valor,
            compra.Data,
            compra.Fixa,
            compra.Periodo,
            compra.CategoriaId,
            compra.VeiculoId,
            compra.Km,
            compra.CartaoId,
            compra.CompetenciaFatura,
            compra.TipoMovimentacaoFixa,
            ehMovimentacaoFatura: false,
            faturaAgregadaId: faturaAgregadaId);
          total++;
        }
      }

      return total;
    }

    public IEnumerable<Saida> ListarComprasCartaoPorPeriodoSemFatura(Guid usuarioId, DateTime dataInicio, DateTime dataFim)
    {
      lock (_sync)
      {
        return _movimentacoes
          .OfType<Saida>()
          .Where(s => s.UsuarioId == usuarioId && s.CartaoId.HasValue && !s.EhMovimentacaoFatura && s.FaturaAgregadaId == null && s.Data >= dataInicio && s.Data <= dataFim)
          .ToList();
      }
    }

    public Saida? ObterMovimentacaoFatura(Guid usuarioId, Guid faturaAgregadaId)
    {
      lock (_sync)
      {
        return _movimentacoes
          .OfType<Saida>()
          .FirstOrDefault(s => s.UsuarioId == usuarioId && s.EhMovimentacaoFatura && s.FaturaAgregadaId == faturaAgregadaId);
      }
    }
  }
}
