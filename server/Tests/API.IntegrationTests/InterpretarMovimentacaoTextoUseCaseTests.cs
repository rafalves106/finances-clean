using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.Services;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class InterpretarMovimentacaoTextoUseCaseTests
{
  [Fact]
  public async Task Executar_TextoVazio_DeveFalhar()
  {
    var useCase = new InterpretarMovimentacaoTextoUseCase(
      new FakeAssistenteIAService(), new InMemoryCategoriaRepository());

    await Assert.ThrowsAsync<ArgumentException>(() => useCase.Executar(Guid.NewGuid(), "  "));
  }

  [Fact]
  public async Task Executar_SoMandaCategoriasGlobaisEDoProprioUsuario()
  {
    var usuarioId = Guid.NewGuid();
    var outroUsuarioId = Guid.NewGuid();

    var global = Categoria.CriarGlobal("Alimentação", "🍔");
    var doUsuario = new Categoria("Categoria Pessoal", usuarioId);
    var deOutroUsuario = new Categoria("Categoria de Outro", outroUsuarioId);

    var categoriaRepo = new InMemoryCategoriaRepository(new[] { global, doUsuario, deOutroUsuario });
    var iaService = new FakeAssistenteIAService();
    var useCase = new InterpretarMovimentacaoTextoUseCase(iaService, categoriaRepo);

    await useCase.Executar(usuarioId, "Mercado 50 reais");

    Assert.NotNull(iaService.CategoriasRecebidas);
    Assert.Equal(2, iaService.CategoriasRecebidas!.Count);
    Assert.Contains(iaService.CategoriasRecebidas, c => c.Id == global.Id);
    Assert.Contains(iaService.CategoriasRecebidas, c => c.Id == doUsuario.Id);
    Assert.DoesNotContain(iaService.CategoriasRecebidas, c => c.Id == deOutroUsuario.Id);
  }

  [Fact]
  public async Task Executar_RepassaOResultadoDoServicoDeIA()
  {
    var usuarioId = Guid.NewGuid();
    var categoriaRepo = new InMemoryCategoriaRepository();
    var esperado = new InterpretacaoMovimentacaoResultado(
      true, "Mercado", 50m, new DateTime(2026, 8, 17), "Saida", null, null);
    var iaService = new FakeAssistenteIAService { ResultadoFixo = esperado };
    var useCase = new InterpretarMovimentacaoTextoUseCase(iaService, categoriaRepo);

    var resultado = await useCase.Executar(usuarioId, "Mercado 50 reais hoje");

    Assert.Equal(esperado, resultado);
  }

  private sealed class FakeAssistenteIAService : IAssistenteIAService
  {
    public IReadOnlyList<CategoriaResumoIA>? CategoriasRecebidas { get; private set; }
    public InterpretacaoMovimentacaoResultado ResultadoFixo { get; set; } =
      new(true, "Título", 10m, DateTime.Today, "Saida", null, null);

    public Task<InterpretacaoMovimentacaoResultado> InterpretarMovimentacao(
      string texto, DateTime dataReferencia, IReadOnlyList<CategoriaResumoIA> categorias)
    {
      CategoriasRecebidas = categorias;
      return Task.FromResult(ResultadoFixo);
    }
  }

  private sealed class InMemoryCategoriaRepository : ICategoriaRepository
  {
    private readonly List<Categoria> _categorias;

    public InMemoryCategoriaRepository(IEnumerable<Categoria>? categorias = null)
    {
      _categorias = categorias?.ToList() ?? new List<Categoria>();
    }

    public Guid Adicionar(Categoria categoria)
    {
      _categorias.Add(categoria);
      return categoria.Id;
    }

    public IEnumerable<Categoria> ListarTodas() => _categorias;
    public Categoria? BuscarPorId(Guid id) => _categorias.FirstOrDefault(c => c.Id == id);
    public IDictionary<Guid, decimal> ListarOrcamentosMensaisCategoriasGlobais(
      Guid usuarioId, IEnumerable<Guid> categoriasGlobaisIds) => new Dictionary<Guid, decimal>();
    public void Atualizar(Categoria categoria) { }
    public void Remover(Guid id) { }
  }
}
