using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class CartaoUseCasesTests
{
  [Theory]
  [InlineData("2026-06-09", 10, 202606)]
  [InlineData("2026-06-10", 10, 202607)]
  [InlineData("2026-06-11", 10, 202607)]
  public void CompetenciaFatura_DeveRespeitarRegraVirada(string dataCompraIso, int diaFechamento, int competenciaEsperada)
  {
    var dataCompra = DateTime.SpecifyKind(DateTime.Parse(dataCompraIso), DateTimeKind.Utc);

    var competencia = CompetenciaFaturaCalculator.CalcularCompetencia(dataCompra, diaFechamento);

    Assert.Equal(competenciaEsperada, competencia);
  }

  [Fact]
  public void CompetenciaFatura_DeveNormalizarFechamentoEmMesCurto()
  {
    var dataCompra = new DateTime(2026, 2, 28, 10, 0, 0, DateTimeKind.Utc);

    var competencia = CompetenciaFaturaCalculator.CalcularCompetencia(dataCompra, 31);

    Assert.Equal(202603, competencia);
  }

  [Fact]
  public void CartaoManual_CicloComMesCruzado_DeveSerValido()
  {
    var usuarioId = Guid.NewGuid();

    var cartao = new CartaoManual(usuarioId, "Cartão principal", 5000m, 29, 5);

    Assert.Equal(29, cartao.DiaFechamento);
    Assert.Equal(5, cartao.DiaVencimento);
  }

  [Fact]
  public void CadastrarCartao_AteTresAtivos_DevePermitir()
  {
    var usuarioId = Guid.NewGuid();
    var repository = new InMemoryCartaoRepository();
    var useCase = new CadastrarCartaoManualUseCase(repository);

    var cartao1 = useCase.Executar(usuarioId, "Cartão A", 3000m, 10, 20);
    var cartao2 = useCase.Executar(usuarioId, "Cartão B", 4000m, 12, 22);
    var cartao3 = useCase.Executar(usuarioId, "Cartão C", 5000m, 15, 25);

    Assert.NotNull(cartao1);
    Assert.NotNull(cartao2);
    Assert.NotNull(cartao3);
    Assert.Equal(3, repository.ContarCartoesAtivos(usuarioId));
  }

  [Fact]
  public void CadastrarCartao_QuartoAtivo_DeveFalhar()
  {
    var usuarioId = Guid.NewGuid();
    var repository = new InMemoryCartaoRepository();
    var useCase = new CadastrarCartaoManualUseCase(repository);

    useCase.Executar(usuarioId, "Cartão A", 3000m, 10, 20);
    useCase.Executar(usuarioId, "Cartão B", 4000m, 12, 22);
    useCase.Executar(usuarioId, "Cartão C", 5000m, 15, 25);

    var ex = Assert.Throws<InvalidOperationException>(() =>
        useCase.Executar(usuarioId, "Cartão D", 4500m, 13, 23));

    Assert.Equal("CARTAO_LIMITE_ATIVOS_EXCEDIDO", ex.Message);
  }

  [Fact]
  public void InativarCartao_ComTresAtivosEAdicionarNovo_DevePermitir()
  {
    var usuarioId = Guid.NewGuid();
    var repository = new InMemoryCartaoRepository();
    var cadastrarUseCase = new CadastrarCartaoManualUseCase(repository);
    var inativarUseCase = new InativarCartaoManualUseCase(repository);

    var cartao1 = cadastrarUseCase.Executar(usuarioId, "Cartão A", 3000m, 10, 20);
    cadastrarUseCase.Executar(usuarioId, "Cartão B", 4000m, 12, 22);
    cadastrarUseCase.Executar(usuarioId, "Cartão C", 5000m, 15, 25);

    inativarUseCase.Executar(usuarioId, cartao1.Id);

    var novoCartao = cadastrarUseCase.Executar(usuarioId, "Cartão D", 4500m, 13, 23);

    Assert.NotNull(novoCartao);
    Assert.Equal(3, repository.ContarCartoesAtivos(usuarioId));
  }

  [Fact]
  public void EditarEInativarCartao_DeveAtualizarEstado()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão A", 3000m, 10, 20);
    var repository = new InMemoryCartaoRepository();
    repository.Adicionar(cartao);

    var editarUseCase = new EditarCartaoManualUseCase(repository);
    var inativarUseCase = new InativarCartaoManualUseCase(repository);

    editarUseCase.Executar(usuarioId, cartao.Id, "Cartão Atualizado", 4500m, 11, 21);
    inativarUseCase.Executar(usuarioId, cartao.Id);

    var atualizado = repository.ObterPorId(cartao.Id, usuarioId);
    Assert.NotNull(atualizado);
    Assert.Equal("Cartão Atualizado", atualizado!.Nome);
    Assert.Equal(4500m, atualizado.LimiteTotal);
    Assert.False(atualizado.Ativo);
  }

  [Fact]
  public void ObterResumoCartao_SemLancamentos_DeveRetornarLimiteDisponivelIntegral()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão A", 2000m, 10, 20);
    var repository = new InMemoryCartaoRepository();
    repository.Adicionar(cartao);

    var useCase = new ObterResumoCartaoUseCase(repository);
    var resumo = useCase.Executar(usuarioId);

    Assert.NotNull(resumo);
    Assert.Equal(0m, resumo!.Limite.Utilizado);
    Assert.Equal(2000m, resumo.Limite.Disponivel);
    Assert.Equal(0m, resumo.Limite.PercentualUso);
  }

  [Fact]
  public void PreviewBackfill_DeveClassificarAplicavelAmbiguoIgnoradoEApenasCartao()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão", 3000m, 29, 5);
    var cartaoRepository = new InMemoryCartaoRepository();
    cartaoRepository.Adicionar(cartao);

    var aplicavel = new Saida("Compra A", "Compra 07/05", 120m, new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), usuarioId, cartaoId: cartao.Id);
    var ambiguo = new Saida("Compra B", "Compra 07/05 e 08-05", 120m, new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), usuarioId, cartaoId: cartao.Id);
    var ignoradoFormato = new Saida("Compra C", "Compra em 2026-05-07", 120m, new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), usuarioId, cartaoId: cartao.Id);
    var naoCartao = new Saida("Conta", "Pagamento 07/05", 90m, new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), usuarioId);

    var movRepository = new InMemoryMovimentacaoRepository([aplicavel, ambiguo, ignoradoFormato, naoCartao]);
    var backfillRepository = new InMemoryCartaoBackfillRepository();
    var useCase = new ExecutarPreviewBackfillCompetenciaCartaoUseCase(movRepository, cartaoRepository, backfillRepository);

    var result = useCase.Executar(usuarioId);

    Assert.Equal(3, result.TotalAnalisado);
    Assert.Equal(1, result.TotalAplicavel);
    Assert.Equal(1, result.TotalAmbiguo);
    Assert.Equal(1, result.TotalIgnorado);

    var itens = backfillRepository.ListarItens(result.ExecutionId, usuarioId);
    Assert.DoesNotContain(itens, i => i.MovimentacaoId == naoCartao.Id);
  }

  [Fact]
  public void ApplyBackfill_SemPreview_DeveFalhar()
  {
    var usuarioId = Guid.NewGuid();
    var movRepository = new InMemoryMovimentacaoRepository([]);
    var backfillRepository = new InMemoryCartaoBackfillRepository();
    var useCase = new ExecutarApplyBackfillCompetenciaCartaoUseCase(movRepository, backfillRepository);

    var ex = Assert.Throws<InvalidOperationException>(() => useCase.Executar(usuarioId, Guid.NewGuid()));

    Assert.Equal("BACKFILL_EXECUTION_INVALIDA", ex.Message);
  }

  [Fact]
  public void ApplyBackfill_ExecutionQueNaoEhPreview_DeveFalharComPreviewObrigatorio()
  {
    var usuarioId = Guid.NewGuid();
    var movRepository = new InMemoryMovimentacaoRepository([]);
    var backfillRepository = new InMemoryCartaoBackfillRepository();

    var execucaoInvalida = new CartaoBackfillExecution(usuarioId, CartaoBackfillModo.Apply, usuarioId.ToString());
    execucaoInvalida.DefinirTotais(0, 0, 0, 0, 0, 0);
    backfillRepository.AdicionarExecucao(execucaoInvalida);

    var useCase = new ExecutarApplyBackfillCompetenciaCartaoUseCase(movRepository, backfillRepository);
    var ex = Assert.Throws<InvalidOperationException>(() => useCase.Executar(usuarioId, execucaoInvalida.Id));

    Assert.Equal("BACKFILL_PREVIEW_OBRIGATORIO", ex.Message);
  }

  [Fact]
  public void ApplyERollbackBackfill_DeveAlterarSomenteAplicaveisEPermitirReversaoPorExecutionId()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão", 3000m, 29, 5);
    var cartaoRepository = new InMemoryCartaoRepository();
    cartaoRepository.Adicionar(cartao);

    var movAplicavel = new Saida("Compra A", "Compra 07/05", 120m, new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), usuarioId, cartaoId: cartao.Id);
    var movAmbiguo = new Saida("Compra B", "Compra 07/05 e 08-05", 120m, new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), usuarioId, cartaoId: cartao.Id);
    var naoCartao = new Saida("Conta", "Pagamento 07/05", 90m, new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc), usuarioId);

    var dataOriginalAplicavel = movAplicavel.Data;
    var dataOriginalAmbiguo = movAmbiguo.Data;
    var dataOriginalNaoCartao = naoCartao.Data;

    var movRepository = new InMemoryMovimentacaoRepository([movAplicavel, movAmbiguo, naoCartao]);
    var backfillRepository = new InMemoryCartaoBackfillRepository();

    var previewUseCase = new ExecutarPreviewBackfillCompetenciaCartaoUseCase(movRepository, cartaoRepository, backfillRepository);
    var previewResult = previewUseCase.Executar(usuarioId);

    var applyUseCase = new ExecutarApplyBackfillCompetenciaCartaoUseCase(movRepository, backfillRepository);
    var applyResult = applyUseCase.Executar(usuarioId, previewResult.ExecutionId);

    Assert.Equal(1, applyResult.TotalAplicado);
    Assert.NotEqual(dataOriginalAplicavel, movAplicavel.Data);
    Assert.Equal(dataOriginalAmbiguo, movAmbiguo.Data);
    Assert.Equal(dataOriginalNaoCartao, naoCartao.Data);

    var rollbackUseCase = new ExecutarRollbackBackfillCompetenciaCartaoUseCase(movRepository, backfillRepository);
    var rollbackResult = rollbackUseCase.Executar(usuarioId, applyResult.ExecutionId);

    Assert.Equal(1, rollbackResult.TotalRevertido);
    Assert.Equal(dataOriginalAplicavel, movAplicavel.Data);
    Assert.Equal(dataOriginalAmbiguo, movAmbiguo.Data);
    Assert.Equal(dataOriginalNaoCartao, naoCartao.Data);
  }

  private sealed class InMemoryCartaoRepository : ICartaoRepository
  {
    private readonly List<CartaoManual> _cartoes = new();
    private readonly Dictionary<Guid, (decimal atual, decimal proxima)> _previsoes = new();

    public void Adicionar(CartaoManual cartao)
    {
      _cartoes.Add(cartao);
    }

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
    {
      var query = _cartoes.Where(c => c.UsuarioId == usuarioId);
      if (!incluirInativos)
      {
        query = query.Where(c => c.Ativo);
      }

      return query
        .OrderByDescending(c => c.Ativo)
        .ThenByDescending(c => c.UpdatedAtUtc)
        .ToList();
    }

    public IReadOnlyCollection<CartaoManual> ListarAtivosPorUsuario(Guid usuarioId)
      => _cartoes
        .Where(c => c.UsuarioId == usuarioId && c.Ativo)
        .OrderByDescending(c => c.UpdatedAtUtc)
        .ToList();

    public int ContarCartoesAtivos(Guid usuarioId, Guid? ignorarCartaoId = null)
      => _cartoes.Count(c => c.UsuarioId == usuarioId && c.Ativo && (!ignorarCartaoId.HasValue || c.Id != ignorarCartaoId.Value));

    public (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(Guid cartaoId, DateTime referenciaUtc, int diaFechamento)
    {
      if (_previsoes.TryGetValue(cartaoId, out var previsao))
      {
        return (previsao.atual, previsao.proxima);
      }

      return (0m, 0m);
    }
  }

  private sealed class InMemoryMovimentacaoRepository(List<Movimentacao> movimentacoes) : IMovimentacaoRepository
  {
    public Guid Adicionar(Movimentacao movimentacao)
    {
      movimentacoes.Add(movimentacao);
      return movimentacao.Id;
    }

    public IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null)
    {
      var query = movimentacoes.AsEnumerable();
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
        => movimentacoes.Where(m => m.Data.Month == mes && m.Data.Year == ano);

    public void Remover(Movimentacao movimentacao)
        => movimentacoes.Remove(movimentacao);

    public void Atualizar(Movimentacao movimentacao)
    {
      var index = movimentacoes.FindIndex(m => m.Id == movimentacao.Id);
      if (index >= 0)
      {
        movimentacoes[index] = movimentacao;
      }
    }

    public Movimentacao? ObterPorId(Guid id)
        => movimentacoes.FirstOrDefault(m => m.Id == id);

    public IEnumerable<Entrada> ListarEntradas()
        => movimentacoes.OfType<Entrada>();

    public IEnumerable<Saida> ListarSaidas()
        => movimentacoes.OfType<Saida>();

    public IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim)
        => movimentacoes.Where(m => m.Data >= dataInicio && m.Data <= dataFim);

    public IEnumerable<Movimentacao> ListarPorPeriodoPorUsuario(DateTime dataInicio, DateTime dataFim, Guid usuarioId)
        => movimentacoes.Where(m => m.UsuarioId == usuarioId && m.Data >= dataInicio && m.Data <= dataFim);

    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId)
        => movimentacoes.Where(m => m.GrupoRecorrenciaId == grupoRecorrenciaId && m.UsuarioId == usuarioId);

    public void AtualizarEmLote(IEnumerable<Movimentacao> itens)
    {
      foreach (var item in itens)
      {
        Atualizar(item);
      }
    }

    public decimal ObterSaldoAcumulado(int mes, int ano) => 0;
  }

  private sealed class InMemoryCartaoBackfillRepository : ICartaoBackfillRepository
  {
    private readonly List<CartaoBackfillExecution> _execucoes = [];
    private readonly List<CartaoBackfillExecutionItem> _itens = [];

    public void AdicionarExecucao(CartaoBackfillExecution execution)
    {
      _execucoes.Add(execution);
      _itens.AddRange(execution.Itens);
    }

    public CartaoBackfillExecution? ObterExecucao(Guid executionId, Guid usuarioId)
      => _execucoes.FirstOrDefault(e => e.Id == executionId && e.UsuarioId == usuarioId);

    public IReadOnlyCollection<CartaoBackfillExecutionItem> ListarItens(Guid executionId, Guid usuarioId)
    {
      var execucao = ObterExecucao(executionId, usuarioId);
      if (execucao is null)
      {
        return [];
      }

      return _itens.Where(i => i.ExecutionId == executionId).ToList();
    }

    public bool ExisteApplyParaPreview(Guid previewExecutionId, Guid usuarioId)
      => _execucoes.Any(e => e.UsuarioId == usuarioId && e.SourceExecutionId == previewExecutionId && e.Modo == CartaoBackfillModo.Apply);
  }
}
