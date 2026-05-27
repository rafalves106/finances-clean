using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class ObterComparativoCategoriaMensalUseCaseTests
{
  [Fact]
  public void Executar_DeveConsolidarUltimosTresMesesPorCategoria()
  {
    var usuarioId = Guid.NewGuid();
    var outroUsuarioId = Guid.NewGuid();
    var categoriaMercado = new Categoria("Mercado", usuarioId);

    var dados = new List<Movimentacao>
        {
            new Saida("Compra 1", "", 100m, new DateTime(2026, 2, 10), usuarioId, categoriaId: categoriaMercado.Id),
            new Saida("Compra 2", "", 150m, new DateTime(2026, 3, 5), usuarioId, categoriaId: categoriaMercado.Id),
            new Entrada("Cashback", "", 20m, new DateTime(2026, 3, 7), usuarioId, categoriaId: categoriaMercado.Id),
            new Saida("Sem categoria", "", 90m, new DateTime(2026, 4, 2), usuarioId),
            new Saida("Outro usuário", "", 999m, new DateTime(2026, 4, 2), outroUsuarioId)
        };

    var repo = new InMemoryMovimentacaoRepository(dados);
    var useCase = new ObterComparativoCategoriaMensalUseCase(repo);

    var resultado = useCase.Executar(usuarioId, 4, 2026).ToList();

    Assert.Contains(resultado, r => r.Ano == 2026 && r.Mes == 2 && r.Categoria == "Sem categoria" && r.TotalSaidas == 100m);
    Assert.Contains(resultado, r => r.Ano == 2026 && r.Mes == 3 && r.Categoria == "Sem categoria" && r.TotalEntradas == 20m && r.TotalSaidas == 150m);
    Assert.Contains(resultado, r => r.Ano == 2026 && r.Mes == 4 && r.Categoria == "Sem categoria" && r.TotalSaidas == 90m);
    Assert.DoesNotContain(resultado, r => r.TotalSaidas == 999m);
  }

  [Fact]
  public void Executar_ComMesInvalido_DeveFalhar()
  {
    var useCase = new ObterComparativoCategoriaMensalUseCase(new InMemoryMovimentacaoRepository());

    var ex = Assert.Throws<ArgumentException>(() => useCase.Executar(Guid.NewGuid(), 13, 2026));
    Assert.Equal("O mês de referência deve estar entre 1 e 12.", ex.Message);
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
    public IEnumerable<Movimentacao> ListarPorMes(int mes, int ano) => _dados.Where(m => m.Data.Month == mes && m.Data.Year == ano);
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
}