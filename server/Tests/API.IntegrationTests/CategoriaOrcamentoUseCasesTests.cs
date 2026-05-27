using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class CategoriaOrcamentoUseCasesTests
{
  [Fact]
  public void AtualizarCategoriaUseCase_ComCategoriaGlobal_DeveSalvarOverrideSemAlterarDadosGlobais()
  {
    var usuarioId = Guid.NewGuid();
    var categoriaGlobal = Categoria.CriarGlobal("Mercado", "🛒", "#22c55e");

    var categoriaRepo = new InMemoryCategoriaRepository(new[] { categoriaGlobal });
    var overrideRepo = new InMemoryCategoriaOrcamentoUsuarioRepository();
    var useCase = new AtualizarCategoriaUseCase(categoriaRepo, overrideRepo);

    useCase.Executar(
      usuarioId,
      categoriaGlobal.Id,
      new CategoriaDTO("Nome ignorado", "❌", "#000000", 800m));

    var overrideSalvo = overrideRepo.BuscarPorCategoriaGlobalEUsuario(categoriaGlobal.Id, usuarioId);

    Assert.NotNull(overrideSalvo);
    Assert.Equal(800m, overrideSalvo!.OrcamentoMensal);
    Assert.Equal("Mercado", categoriaGlobal.Nome);
    Assert.Equal("🛒", categoriaGlobal.Icone);
    Assert.Equal("#22c55e", categoriaGlobal.Cor);
  }

  [Fact]
  public void ObterAlertasOrcamentoCategoriasUseCase_DeveClassificarFaixasEContarAlertas()
  {
    var usuarioId = Guid.NewGuid();
    var categoriaMercado = new Categoria("Mercado", usuarioId, "🛒", "#22c55e", 1000m);
    var categoriaLazer = new Categoria("Lazer", usuarioId, "🎮", "#3b82f6", 300m);
    var categoriaGlobal = Categoria.CriarGlobal("Saúde", "💊", "#ef4444");

    var categoriaRepo = new InMemoryCategoriaRepository(new[] { categoriaMercado, categoriaLazer, categoriaGlobal });
    categoriaRepo.DefinirOrcamentoGlobalEfetivo(usuarioId, categoriaGlobal.Id, 200m);

    var movimentacoes = new List<Movimentacao>
    {
      new Saida("Supermercado", "", 820m, new DateTime(2026, 5, 10), usuarioId, categoriaId: categoriaMercado.Id),
      new Saida("Cinema", "", 330m, new DateTime(2026, 5, 12), usuarioId, categoriaId: categoriaLazer.Id),
      new Saida("Farmácia", "", 50m, new DateTime(2026, 5, 15), usuarioId, categoriaId: categoriaGlobal.Id),
      new Entrada("Salário", "", 9000m, new DateTime(2026, 5, 5), usuarioId, categoriaId: categoriaMercado.Id)
    };

    var movRepo = new InMemoryMovimentacaoRepository(movimentacoes);
    var useCase = new ObterAlertasOrcamentoCategoriasUseCase(categoriaRepo, movRepo);

    var resultado = useCase.Executar(usuarioId, 5, 2026);
    var alertas = resultado.Categorias.ToList();

    Assert.Equal(2, resultado.TotalCategoriasEmAlerta);
    Assert.Contains(alertas, item => item.Nome == "Mercado" && item.EstadoAlerta == "Atencao" && item.PercentualConsumo == 82m);
    Assert.Contains(alertas, item => item.Nome == "Lazer" && item.EstadoAlerta == "Estourado" && item.PercentualConsumo == 110m);
    Assert.Contains(alertas, item => item.Nome == "Saúde" && item.EstadoAlerta == "Normal" && item.PercentualConsumo == 25m);
  }

  private sealed class InMemoryCategoriaRepository : ICategoriaRepository
  {
    private readonly List<Categoria> _categorias;
    private readonly Dictionary<(Guid UsuarioId, Guid CategoriaGlobalId), decimal> _orcamentosGlobais = new();

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

    public Categoria? BuscarPorId(Guid id) => _categorias.FirstOrDefault(categoria => categoria.Id == id);

    public IDictionary<Guid, decimal> ListarOrcamentosMensaisCategoriasGlobais(Guid usuarioId, IEnumerable<Guid> categoriasGlobaisIds)
    {
      return categoriasGlobaisIds
        .Distinct()
        .Where(categoriaId => _orcamentosGlobais.TryGetValue((usuarioId, categoriaId), out _))
        .ToDictionary(categoriaId => categoriaId, categoriaId => _orcamentosGlobais[(usuarioId, categoriaId)]);
    }

    public void Atualizar(Categoria categoria) { }

    public void Remover(Guid id)
    {
      var categoria = BuscarPorId(id);
      if (categoria is not null)
      {
        _categorias.Remove(categoria);
      }
    }

    public void DefinirOrcamentoGlobalEfetivo(Guid usuarioId, Guid categoriaGlobalId, decimal orcamento)
    {
      _orcamentosGlobais[(usuarioId, categoriaGlobalId)] = orcamento;
    }
  }

  private sealed class InMemoryCategoriaOrcamentoUsuarioRepository : ICategoriaOrcamentoUsuarioRepository
  {
    private readonly List<CategoriaOrcamentoUsuario> _dados = new();

    public CategoriaOrcamentoUsuario? BuscarPorCategoriaGlobalEUsuario(Guid categoriaGlobalId, Guid usuarioId)
      => _dados.FirstOrDefault(item => item.CategoriaGlobalId == categoriaGlobalId && item.UsuarioId == usuarioId);

    public void Salvar(CategoriaOrcamentoUsuario categoriaOrcamentoUsuario)
    {
      var existente = BuscarPorCategoriaGlobalEUsuario(categoriaOrcamentoUsuario.CategoriaGlobalId, categoriaOrcamentoUsuario.UsuarioId);

      if (existente is null)
      {
        _dados.Add(categoriaOrcamentoUsuario);
      }
    }

    public void Remover(CategoriaOrcamentoUsuario categoriaOrcamentoUsuario)
      => _dados.Remove(categoriaOrcamentoUsuario);
  }

  private sealed class InMemoryMovimentacaoRepository : IMovimentacaoRepository
  {
    private readonly List<Movimentacao> _dados;

    public InMemoryMovimentacaoRepository(IEnumerable<Movimentacao> dadosIniciais)
    {
      _dados = dadosIniciais.ToList();
    }

    public Guid Adicionar(Movimentacao movimentacao)
    {
      _dados.Add(movimentacao);
      return movimentacao.Id;
    }

    public IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null) => _dados;
    public IEnumerable<Movimentacao> ListarPorMes(int mes, int ano) => _dados.Where(item => item.Data.Month == mes && item.Data.Year == ano);
    public void Remover(Movimentacao movimentacao) => _dados.Remove(movimentacao);
    public void Atualizar(Movimentacao movimentacao) { }
    public Movimentacao? ObterPorId(Guid id) => _dados.FirstOrDefault(item => item.Id == id);
    public IEnumerable<Entrada> ListarEntradas() => _dados.OfType<Entrada>();
    public IEnumerable<Saida> ListarSaidas() => _dados.OfType<Saida>();
    public IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim)
      => _dados.Where(item => item.Data >= dataInicio && item.Data <= dataFim);
    public IEnumerable<Movimentacao> ListarPorPeriodoPorUsuario(DateTime dataInicio, DateTime dataFim, Guid usuarioId)
      => _dados.Where(item => item.UsuarioId == usuarioId && item.Data >= dataInicio && item.Data <= dataFim);
    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId)
      => _dados.Where(item => item.GrupoRecorrenciaId == grupoRecorrenciaId && item.UsuarioId == usuarioId);
    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes) { }
    public decimal ObterSaldoAcumulado(int mes, int ano) => 0m;
  }
}