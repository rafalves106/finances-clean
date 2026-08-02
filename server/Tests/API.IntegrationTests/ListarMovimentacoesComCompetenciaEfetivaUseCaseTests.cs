using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class ListarMovimentacoesComCompetenciaEfetivaUseCaseTests
{
  [Fact]
  public void Executar_MovimentacaoSemCartao_UsaMesDaDataDaCompra()
  {
    var usuarioId = Guid.NewGuid();
    var dentroDoMes = new Saida("Mercado", "", 100m, new DateTime(2026, 8, 10), usuarioId);
    var foraDoMes = new Saida("Mercado", "", 50m, new DateTime(2026, 7, 10), usuarioId);

    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { dentroDoMes, foraDoMes });
    var cartaoRepo = new InMemoryCartaoRepository();
    var useCase = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);

    var resultado = useCase.Executar(usuarioId, 8, 2026).ToList();

    var unica = Assert.Single(resultado);
    Assert.Equal(dentroDoMes.Id, unica.Id);
  }

  [Fact]
  public void Executar_CompraNoCartaoComVencimentoNoMesSeguinte_ContaNoMesDeVencimento()
  {
    var usuarioId = Guid.NewGuid();
    // Fechamento dia 29, vencimento dia 5: fatura fechada em agosto (competencia 202608) vence em setembro.
    var cartao = new CartaoManual(usuarioId, "Itaú CC", 3000m, diaFechamento: 29, diaVencimento: 5);

    var compraAgosto = new Saida(
        "Notebook", "", 1500m, new DateTime(2026, 8, 15), usuarioId,
        cartaoId: cartao.Id, competenciaFatura: 202608);

    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { compraAgosto });
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });
    var useCase = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);

    Assert.Empty(useCase.Executar(usuarioId, 8, 2026));

    var resultadoSetembro = useCase.Executar(usuarioId, 9, 2026).ToList();
    var unica = Assert.Single(resultadoSetembro);
    Assert.Equal(compraAgosto.Id, unica.Id);
  }

  [Fact]
  public void Executar_CompraNoCartaoComVencimentoNoMesmoMes_ContaNoMesmoMesDaCompetencia()
  {
    var usuarioId = Guid.NewGuid();
    // Fechamento dia 10, vencimento dia 17: fatura fechada em agosto vence ainda em agosto.
    var cartao = new CartaoManual(usuarioId, "Cartão Rápido", 2000m, diaFechamento: 10, diaVencimento: 17);

    var compra = new Saida(
        "Farmácia", "", 80m, new DateTime(2026, 8, 3), usuarioId,
        cartaoId: cartao.Id, competenciaFatura: 202608);

    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { compra });
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });
    var useCase = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);

    var resultado = useCase.Executar(usuarioId, 8, 2026).ToList();

    Assert.Single(resultado);
  }

  [Fact]
  public void Executar_CartaoInativo_NaoContribui()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Antigo", 1000m, diaFechamento: 29, diaVencimento: 5);
    cartao.Inativar();

    var compra = new Saida(
        "Compra", "", 100m, new DateTime(2026, 8, 15), usuarioId,
        cartaoId: cartao.Id, competenciaFatura: 202608);

    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { compra });
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });
    var useCase = new ListarMovimentacoesComCompetenciaEfetivaUseCase(movRepo, cartaoRepo);

    Assert.Empty(useCase.Executar(usuarioId, 9, 2026));
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
