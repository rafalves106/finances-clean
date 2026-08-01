using System.Globalization;
using System.Text;
using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class GerarRelatorioMensalUseCaseTests
{
  private static readonly CultureInfo PtBr = new("pt-BR");

  private static string Moeda(decimal valor) => valor.ToString("C", PtBr);

  [Fact]
  public void Executar_DeveIncluirResumoTopCategoriasEComparacaoComMesAnterior()
  {
    var usuarioId = Guid.NewGuid();

    var movimentacoes = new Movimentacao[]
    {
      new Entrada("Salário", "Mensal", 5000m, new DateTime(2026, 8, 5), usuarioId),
      new Saida("Mercado", "Compras", 800m, new DateTime(2026, 8, 10), usuarioId),
      new Saida("Farmácia", "Remédios", 200m, new DateTime(2026, 8, 15), usuarioId),
      new Entrada("Salário", "Mensal", 4500m, new DateTime(2026, 7, 5), usuarioId),
      new Saida("Mercado", "Compras", 600m, new DateTime(2026, 7, 10), usuarioId),
    };

    var repository = new InMemoryMovimentacaoRepository(movimentacoes);
    var resumoUseCase = new ObterResumoMensalUseCase(repository);
    var comparativoUseCase = new ObterComparativoCategoriaMensalUseCase(repository);
    var useCase = new GerarRelatorioMensalUseCase(resumoUseCase, comparativoUseCase);

    var resultado = useCase.Executar(usuarioId, 8, 2026);
    var html = Encoding.UTF8.GetString(resultado.Conteudo);

    Assert.Equal("relatorio_2026_08.html", resultado.NomeArquivo);
    Assert.Contains(Moeda(5000m), html);
    Assert.Contains(Moeda(1000m), html);
    Assert.Contains(Moeda(4000m), html);
    Assert.Contains("agosto", html, StringComparison.OrdinalIgnoreCase);
    Assert.Contains("julho", html, StringComparison.OrdinalIgnoreCase);
    Assert.Contains("66,7%", html);
  }

  [Fact]
  public void Executar_SemMovimentacoes_DeveGerarRelatorioComMensagensDeAusenciaDeDados()
  {
    var usuarioId = Guid.NewGuid();
    var repository = new InMemoryMovimentacaoRepository();
    var useCase = new GerarRelatorioMensalUseCase(
        new ObterResumoMensalUseCase(repository),
        new ObterComparativoCategoriaMensalUseCase(repository));

    var resultado = useCase.Executar(usuarioId, 3, 2026);
    var html = Encoding.UTF8.GetString(resultado.Conteudo);

    Assert.Contains("Nenhuma despesa registrada neste mês.", html);
    Assert.Contains("Sem dados suficientes para comparação.", html);
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

    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes) { }

    public decimal ObterSaldoAcumulado(int mes, int ano) => 0m;
  }
}
