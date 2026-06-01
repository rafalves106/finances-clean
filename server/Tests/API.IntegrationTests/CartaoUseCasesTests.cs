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
  public void CartaoManual_CicloInvalido_DeveFalhar()
  {
    var usuarioId = Guid.NewGuid();

    Assert.Throws<ArgumentException>(() =>
        new CartaoManual(usuarioId, "Cartão principal", 5000m, 20, 10));
  }

  [Fact]
  public void CadastrarCartao_SegundoCartaoAtivo_DeveFalhar()
  {
    var usuarioId = Guid.NewGuid();
    var repository = new InMemoryCartaoRepository();
    repository.Adicionar(new CartaoManual(usuarioId, "Cartão A", 3000m, 10, 20));
    var useCase = new CadastrarCartaoManualUseCase(repository);

    Assert.Throws<InvalidOperationException>(() =>
        useCase.Executar(usuarioId, "Cartão B", 4000m, 12, 22));
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

    public bool ExisteCartaoAtivo(Guid usuarioId, Guid? ignorarCartaoId = null)
        => _cartoes.Any(c => c.UsuarioId == usuarioId && c.Ativo && (!ignorarCartaoId.HasValue || c.Id != ignorarCartaoId.Value));

    public (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(Guid cartaoId, DateTime referenciaUtc, int diaFechamento)
    {
      if (_previsoes.TryGetValue(cartaoId, out var previsao))
      {
        return (previsao.atual, previsao.proxima);
      }

      return (0m, 0m);
    }
  }
}
