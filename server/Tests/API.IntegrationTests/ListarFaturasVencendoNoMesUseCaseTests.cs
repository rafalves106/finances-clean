using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class ListarFaturasVencendoNoMesUseCaseTests
{
  [Fact]
  public void Executar_CartaoComFaturaNoMes_RetornaValorEDataDeVencimentoCorretos()
  {
    var usuarioId = Guid.NewGuid();
    // Fechamento dia 29, vencimento dia 5: fatura fechada em agosto (202608) vence em 2026-09-05.
    var cartao = new CartaoManual(usuarioId, "Itaú CC", 3000m, diaFechamento: 29, diaVencimento: 5);

    var repository = new InMemoryCartaoRepository(new[] { cartao });
    repository.DefinirFatura(cartao.Id, 202608, 1500m);

    var useCase = new ListarFaturasVencendoNoMesUseCase(repository);

    var resultado = useCase.Executar(usuarioId, 9, 2026).ToList();

    var fatura = Assert.Single(resultado);
    Assert.Equal(cartao.Id, fatura.CartaoId);
    Assert.Equal("Itaú CC", fatura.NomeCartao);
    Assert.Equal(1500m, fatura.Valor);
    Assert.Equal(new DateTime(2026, 9, 5), fatura.DataVencimento);
  }

  [Fact]
  public void Executar_SemFaturaNoMes_NaoRetornaCartao()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Itaú CC", 3000m, diaFechamento: 29, diaVencimento: 5);
    var repository = new InMemoryCartaoRepository(new[] { cartao });

    var useCase = new ListarFaturasVencendoNoMesUseCase(repository);

    Assert.Empty(useCase.Executar(usuarioId, 9, 2026));
  }

  [Fact]
  public void Executar_CartaoInativo_NaoAparece()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = new CartaoManual(usuarioId, "Cartão Antigo", 1000m, diaFechamento: 29, diaVencimento: 5);
    cartao.Inativar();

    var repository = new InMemoryCartaoRepository(new[] { cartao });
    repository.DefinirFatura(cartao.Id, 202608, 500m);

    var useCase = new ListarFaturasVencendoNoMesUseCase(repository);

    Assert.Empty(useCase.Executar(usuarioId, 9, 2026));
  }

  private sealed class InMemoryCartaoRepository : ICartaoRepository
  {
    private readonly List<CartaoManual> _cartoes;
    private readonly Dictionary<(Guid CartaoId, int Competencia), decimal> _faturas = new();

    public InMemoryCartaoRepository(IEnumerable<CartaoManual>? cartoes = null)
    {
      _cartoes = cartoes?.ToList() ?? new List<CartaoManual>();
    }

    public void DefinirFatura(Guid cartaoId, int competencia, decimal valor)
      => _faturas[(cartaoId, competencia)] = valor;

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
    public decimal ObterFaturaPorCompetencia(Guid cartaoId, int competencia)
        => _faturas.GetValueOrDefault((cartaoId, competencia), 0m);
  }
}
