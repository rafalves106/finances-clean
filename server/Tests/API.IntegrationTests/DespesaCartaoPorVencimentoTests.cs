using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

// Cobre o comportamento de ponta a ponta: uma compra no cartão só deve contar como
// despesa (resumo mensal, gastos por categoria, alertas de orçamento e saldo
// acumulado) no mês em que a fatura vence, não no mês da compra.
public class DespesaCartaoPorVencimentoTests
{
  // Nota: os testes deste arquivo usam movimentações construídas diretamente pelo
  // domínio (sem EF), então a navegação Movimentacao.Categoria nunca é populada
  // (só CategoriaId) — em produção o repositório real faz .Include(m => m.Categoria).
  // Por isso os asserts de categoria comparam CategoriaId, não Nome.
  private static (Guid usuarioId, CartaoManual cartao, Saida compra, Categoria categoria) MontarCenario()
  {
    var usuarioId = Guid.NewGuid();
    // Fechamento dia 29, vencimento dia 5: fatura fechada em agosto (competencia 202608) vence em setembro.
    var cartao = new CartaoManual(usuarioId, "Itaú CC", 5000m, diaFechamento: 29, diaVencimento: 5);
    var categoria = new Categoria("Eletrônicos", usuarioId, "💻", "#6366f1", orcamentoMensal: 1000m);

    var compra = new Saida(
        "Notebook", "", 1500m, new DateTime(2026, 8, 15), usuarioId,
        cartaoId: cartao.Id, competenciaFatura: 202608, categoriaId: categoria.Id);

    return (usuarioId, cartao, compra, categoria);
  }

  [Fact]
  public void ResumoMensal_CompraNoCartao_NaoContaNoMesDaCompraContaNoMesDeVencimento()
  {
    var (usuarioId, cartao, compra, categoria) = MontarCenario();
    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { compra });
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });
    var listarComCompetenciaEfetiva = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);
    var useCase = new ObterResumoMensalUseCase(listarComCompetenciaEfetiva);

    var resumoAgosto = useCase.Executar(usuarioId, 8, 2026);
    var resumoSetembro = useCase.Executar(usuarioId, 9, 2026);

    Assert.Equal(0m, resumoAgosto.TotalSaidas);
    Assert.Equal(1500m, resumoSetembro.TotalSaidas);

    var categoriaSetembro = Assert.Single(resumoSetembro.PorCategoria);
    Assert.Equal(categoria.Id, categoriaSetembro.CategoriaId);
    Assert.Equal(1500m, categoriaSetembro.TotalSaidas);
  }

  [Fact]
  public void AlertasOrcamento_CompraNoCartao_SoContaNoMesDeVencimento()
  {
    var (usuarioId, cartao, compra, categoria) = MontarCenario();
    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { compra });
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });
    var categoriaRepo = new InMemoryCategoriaRepository(new[] { categoria });
    var listarComCompetenciaEfetiva = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);
    var useCase = new ObterAlertasOrcamentoCategoriasUseCase(categoriaRepo, listarComCompetenciaEfetiva);

    var alertaAgosto = useCase.Executar(usuarioId, 8, 2026).Categorias.Single(a => a.Nome == "Eletrônicos");
    var alertaSetembro = useCase.Executar(usuarioId, 9, 2026).Categorias.Single(a => a.Nome == "Eletrônicos");

    Assert.Equal(0m, alertaAgosto.TotalDespesasMesAtual);
    Assert.Equal("Normal", alertaAgosto.EstadoAlerta);

    Assert.Equal(1500m, alertaSetembro.TotalDespesasMesAtual);
    Assert.Equal("Estourado", alertaSetembro.EstadoAlerta);
  }

  [Fact]
  public void SaldoAcumulado_CompraNoCartao_SoDeduzAPartirDoMesDeVencimento()
  {
    var (usuarioId, cartao, compra, _) = MontarCenario();
    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { compra });
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });
    var useCase = new ObterSaldoAcumuladoUseCase(movRepo, cartaoRepo);

    // Saldo acumulado ANTES de setembro (ou seja, ate agosto inclusive): compra ainda nao venceu.
    var saldoAntesDeSetembro = useCase.Executar(usuarioId, 9, 2026);

    // Saldo acumulado ANTES de outubro (ou seja, ate setembro inclusive): fatura ja venceu.
    var saldoAntesDeOutubro = useCase.Executar(usuarioId, 10, 2026);

    Assert.Equal(0m, saldoAntesDeSetembro);
    Assert.Equal(-1500m, saldoAntesDeOutubro);
  }

  [Fact]
  public void CompraSemCartao_ContinuaSendoContabilizadaPelaDataDaCompra()
  {
    var usuarioId = Guid.NewGuid();
    var compra = new Saida("Mercado", "", 200m, new DateTime(2026, 8, 10), usuarioId);

    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { compra });
    var cartaoRepo = new InMemoryCartaoRepository();
    var listarComCompetenciaEfetiva = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);
    var useCase = new ObterResumoMensalUseCase(listarComCompetenciaEfetiva);

    var resumoAgosto = useCase.Executar(usuarioId, 8, 2026);
    var resumoSetembro = useCase.Executar(usuarioId, 9, 2026);

    Assert.Equal(200m, resumoAgosto.TotalSaidas);
    Assert.Equal(0m, resumoSetembro.TotalSaidas);
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

  private sealed class InMemoryCategoriaRepository : ICategoriaRepository
  {
    private readonly List<Categoria> _categorias;

    public InMemoryCategoriaRepository(IEnumerable<Categoria> categorias)
    {
      _categorias = categorias.ToList();
    }

    public Guid Adicionar(Categoria categoria)
    {
      _categorias.Add(categoria);
      return categoria.Id;
    }

    public IEnumerable<Categoria> ListarTodas() => _categorias;
    public Categoria? BuscarPorId(Guid id) => _categorias.FirstOrDefault(c => c.Id == id);
    public IDictionary<Guid, decimal> ListarOrcamentosMensaisCategoriasGlobais(Guid usuarioId, IEnumerable<Guid> categoriasGlobaisIds)
        => new Dictionary<Guid, decimal>();
    public void Atualizar(Categoria categoria) { }
    public void Remover(Guid id) { }
  }
}
