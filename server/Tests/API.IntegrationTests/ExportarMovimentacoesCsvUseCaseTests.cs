using System.Text;
using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class ExportarMovimentacoesCsvUseCaseTests
{
  [Fact]
  public void Executar_DeveExportarCabecalhoELinhasDoUsuario()
  {
    var usuarioId = Guid.NewGuid();
    var outroUsuarioId = Guid.NewGuid();

    var veiculo = new Veiculo("Carro A", "Marca", "Modelo", 2022, "ABC1234", 5000, usuarioId);

    var movimentacoes = new List<Movimentacao>
        {
            new Entrada("Salário", "Pagamento", 5000m, new DateTime(2026, 1, 5), usuarioId),
            new Saida("Combustível", "Posto \"Centro\"", 230.55m, new DateTime(2026, 1, 10), usuarioId, veiculoId: veiculo.Id),
            new Saida("Nao deve aparecer", "Outro usuário", 100m, new DateTime(2026, 1, 12), outroUsuarioId)
        };

    var movimentacaoRepository = new InMemoryMovimentacaoRepository(movimentacoes);
    var veiculoRepository = new InMemoryVeiculoRepository(new[] { veiculo });
    var useCase = new ExportarMovimentacoesCsvUseCase(movimentacaoRepository, veiculoRepository);

    var resultado = useCase.Executar(usuarioId, new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));
    var csv = Encoding.UTF8.GetString(resultado.Conteudo);

    Assert.Contains("Data;Titulo;Tipo;Categoria;Valor;Veiculo", csv);
    Assert.Contains("2026-01-05;Salário;Receita;;5000.00;", csv);
    Assert.Contains("2026-01-10;Combustível;Despesa;;230.55;Carro A", csv);
    Assert.DoesNotContain("Nao deve aparecer", csv);
  }

  [Fact]
  public void Executar_ComJanelaMaiorQue36Meses_DeveFalharComMensagemClara()
  {
    var useCase = new ExportarMovimentacoesCsvUseCase(
        new InMemoryMovimentacaoRepository(),
        new InMemoryVeiculoRepository());

    var ex = Assert.Throws<ArgumentException>(() =>
        useCase.Executar(Guid.NewGuid(), new DateTime(2020, 1, 1), new DateTime(2023, 1, 2)));

    Assert.Equal("A janela máxima de exportação é de 36 meses.", ex.Message);
  }

  [Fact]
  public void Executar_ComPeriodoInvalido_DeveFalharComMensagemClara()
  {
    var useCase = new ExportarMovimentacoesCsvUseCase(
        new InMemoryMovimentacaoRepository(),
        new InMemoryVeiculoRepository());

    var ex = Assert.Throws<ArgumentException>(() =>
        useCase.Executar(Guid.NewGuid(), new DateTime(2026, 2, 1), new DateTime(2026, 1, 1)));

    Assert.Equal("A data de início deve ser menor ou igual à data de fim.", ex.Message);
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
    public IEnumerable<Movimentacao> ListarPorMes(int mes, int ano) => _dados;
    public void Remover(Movimentacao movimentacao) => _dados.Remove(movimentacao);
    public void Atualizar(Movimentacao movimentacao) { }
    public Movimentacao? ObterPorId(Guid id) => _dados.FirstOrDefault(m => m.Id == id);
    public IEnumerable<Entrada> ListarEntradas() => _dados.OfType<Entrada>();
    public IEnumerable<Saida> ListarSaidas() => _dados.OfType<Saida>();
    public IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim) => _dados.Where(m => m.Data >= dataInicio && m.Data <= dataFim);
    public IEnumerable<Movimentacao> ListarPorPeriodoPorUsuario(DateTime dataInicio, DateTime dataFim, Guid usuarioId)
        => _dados.Where(m => m.UsuarioId == usuarioId && m.Data >= dataInicio && m.Data <= dataFim);
    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId) => _dados;
    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes) { }
    public decimal ObterSaldoAcumulado(int mes, int ano) => 0m;
  }

  private sealed class InMemoryVeiculoRepository : IVeiculoRepository
  {
    private readonly List<Veiculo> _dados;

    public InMemoryVeiculoRepository(IEnumerable<Veiculo>? dadosIniciais = null)
    {
      _dados = dadosIniciais?.ToList() ?? new List<Veiculo>();
    }

    public Guid Adicionar(Veiculo veiculo)
    {
      _dados.Add(veiculo);
      return veiculo.Id;
    }

    public IEnumerable<Veiculo> ListarTodos() => _dados;
    public Veiculo? BuscarPorId(Guid id) => _dados.FirstOrDefault(v => v.Id == id);
    public void Atualizar(Veiculo veiculo) { }
    public void Remover(Guid id) { }
  }
}