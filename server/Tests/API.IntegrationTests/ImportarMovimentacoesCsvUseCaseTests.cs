using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

// Importa o mesmo formato que ExportarMovimentacoesCsvUseCase gera - o
// roundtrip (exportar, editar, reimportar) é o caso de uso principal.
public class ImportarMovimentacoesCsvUseCaseTests
{
  private static (Guid usuarioId, Categoria categoria, Veiculo veiculo, ImportarMovimentacoesCsvUseCase useCase, InMemoryMovimentacaoRepository movRepo) MontarCenario()
  {
    var usuarioId = Guid.NewGuid();
    var categoria = new Categoria("Mercado", usuarioId, "🛒", "#22c55e");
    var veiculo = new Veiculo("Civic", "Honda", "Civic", 2020, "ABC1234", 10000, usuarioId);

    var movRepo = new InMemoryMovimentacaoRepository();
    var categoriaRepo = new InMemoryCategoriaRepository(new[] { categoria });
    var veiculoRepo = new InMemoryVeiculoRepository(new[] { veiculo });
    var useCase = new ImportarMovimentacoesCsvUseCase(movRepo, categoriaRepo, veiculoRepo);

    return (usuarioId, categoria, veiculo, useCase, movRepo);
  }

  [Fact]
  public void Executar_CsvValidoComCabecalho_ImportaTodasAsLinhasEResolveCategoriaEVeiculo()
  {
    var (usuarioId, categoria, veiculo, useCase, movRepo) = MontarCenario();
    var csv = "Data;Titulo;Tipo;Categoria;Valor;Veiculo\n" +
               "2026-08-10;Mercado do mês;Despesa;Mercado;350.50;\n" +
               "2026-08-05;Salário;Receita;;5000.00;\n" +
               "2026-08-12;Gasolina;Despesa;;200;Civic\n";

    var resultado = useCase.Executar(usuarioId, csv);

    Assert.Equal(3, resultado.TotalLinhas);
    Assert.Equal(3, resultado.Importadas);
    Assert.Empty(resultado.Erros);

    var movimentacoes = movRepo.Todas.OrderBy(m => m.Data).ToList();
    Assert.Equal(3, movimentacoes.Count);

    var salario = movimentacoes[0];
    Assert.Equal(TipoMovimentacao.Entrada, salario.Tipo);
    Assert.Equal(5000.00m, salario.Valor);
    Assert.Null(salario.CategoriaId);

    var mercado = movimentacoes[1];
    Assert.Equal(TipoMovimentacao.Saida, mercado.Tipo);
    Assert.Equal(350.50m, mercado.Valor);
    Assert.Equal(categoria.Id, mercado.CategoriaId);

    var gasolina = movimentacoes[2];
    Assert.Equal(veiculo.Id, gasolina.VeiculoId);
  }

  [Fact]
  public void Executar_LinhaComErro_NaoAbortaOLoteEReportaAMotivo()
  {
    var (usuarioId, _, _, useCase, movRepo) = MontarCenario();
    var csv = "Data;Titulo;Tipo;Categoria;Valor;Veiculo\n" +
               "2026-08-10;Mercado do mês;Despesa;;350.50;\n" +
               "data-invalida;Algo;Despesa;;10;\n" +
               "2026-08-11;;Despesa;;10;\n" +
               "2026-08-11;Item;TipoQualquer;;10;\n" +
               "2026-08-11;Item;Despesa;;0;\n";

    var resultado = useCase.Executar(usuarioId, csv);

    Assert.Equal(5, resultado.TotalLinhas);
    Assert.Equal(1, resultado.Importadas);
    Assert.Equal(4, resultado.Erros.Count());
    Assert.Single(movRepo.Todas);

    // linha 2 do arquivo (1a de dado, já que o cabeçalho foi removido antes de contar)
    Assert.Contains(resultado.Erros, e => e.Linha == 2);
  }

  [Fact]
  public void Executar_ValorComVirgulaDecimal_Aceita()
  {
    var (usuarioId, _, _, useCase, movRepo) = MontarCenario();
    var csv = "2026-08-10;Mercado;Despesa;;1.234,56;\n";

    var resultado = useCase.Executar(usuarioId, csv);

    Assert.Equal(1, resultado.Importadas);
    Assert.Equal(1234.56m, movRepo.Todas.Single().Valor);
  }

  [Fact]
  public void Executar_DataFormatoBrasileiro_Aceita()
  {
    var (usuarioId, _, _, useCase, movRepo) = MontarCenario();
    var csv = "10/08/2026;Mercado;Despesa;;100;\n";

    var resultado = useCase.Executar(usuarioId, csv);

    Assert.Equal(1, resultado.Importadas);
    Assert.Equal(new DateTime(2026, 8, 10), movRepo.Todas.Single().Data);
  }

  private sealed class InMemoryMovimentacaoRepository : IMovimentacaoRepository
  {
    private readonly List<Movimentacao> _dados = new();
    public IReadOnlyList<Movimentacao> Todas => _dados;

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

  private sealed class InMemoryCategoriaRepository : ICategoriaRepository
  {
    private readonly List<Categoria> _dados;
    public InMemoryCategoriaRepository(IEnumerable<Categoria> dados) => _dados = dados.ToList();

    public Guid Adicionar(Categoria categoria) { _dados.Add(categoria); return categoria.Id; }
    public IEnumerable<Categoria> ListarTodas() => _dados;
    public Categoria? BuscarPorId(Guid id) => _dados.FirstOrDefault(c => c.Id == id);
    public IDictionary<Guid, decimal> ListarOrcamentosMensaisCategoriasGlobais(Guid usuarioId, IEnumerable<Guid> categoriasGlobaisIds)
        => new Dictionary<Guid, decimal>();
    public void Atualizar(Categoria categoria) { }
    public void Remover(Guid id) => _dados.RemoveAll(c => c.Id == id);
  }

  private sealed class InMemoryVeiculoRepository : IVeiculoRepository
  {
    private readonly List<Veiculo> _dados;
    public InMemoryVeiculoRepository(IEnumerable<Veiculo> dados) => _dados = dados.ToList();

    public Guid Adicionar(Veiculo veiculo) { _dados.Add(veiculo); return veiculo.Id; }
    public IEnumerable<Veiculo> ListarTodos() => _dados;
    public Veiculo? BuscarPorId(Guid id) => _dados.FirstOrDefault(v => v.Id == id);
    public void Atualizar(Veiculo veiculo) { }
    public void Remover(Guid id) => _dados.RemoveAll(v => v.Id == id);
  }
}
