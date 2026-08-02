using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class RemoverMovimentacoesEmLoteUseCaseTests
{
  [Fact]
  public void Executar_RemoveTodasAsMovimentacoesValidas()
  {
    var usuarioId = Guid.NewGuid();
    var item1 = new Saida("Mercado", "", 100m, new DateTime(2026, 8, 1), usuarioId);
    var item2 = new Saida("Farmácia", "", 50m, new DateTime(2026, 8, 2), usuarioId);
    var item3 = new Entrada("Salário", "", 5000m, new DateTime(2026, 8, 5), usuarioId);

    var repository = new InMemoryMovimentacaoRepository(new Movimentacao[] { item1, item2, item3 });
    var useCase = new RemoverMovimentacoesEmLoteUseCase(repository);

    var resultado = useCase.Executar(new[] { item1.Id, item2.Id, item3.Id });

    Assert.Equal(3, resultado.TotalSolicitado);
    Assert.Equal(3, resultado.TotalRemovido);
    Assert.Empty(resultado.IdsNaoEncontrados);
    Assert.Empty(resultado.IdsBloqueados);
    Assert.Empty(repository.Dados);
  }

  [Fact]
  public void Executar_IdInexistente_NaoFalhaEReportaSeparadamente()
  {
    var usuarioId = Guid.NewGuid();
    var item1 = new Saida("Mercado", "", 100m, new DateTime(2026, 8, 1), usuarioId);
    var idInexistente = Guid.NewGuid();

    var repository = new InMemoryMovimentacaoRepository(new Movimentacao[] { item1 });
    var useCase = new RemoverMovimentacoesEmLoteUseCase(repository);

    var resultado = useCase.Executar(new[] { item1.Id, idInexistente });

    Assert.Equal(2, resultado.TotalSolicitado);
    Assert.Equal(1, resultado.TotalRemovido);
    Assert.Equal(new[] { idInexistente }, resultado.IdsNaoEncontrados);
    Assert.Empty(repository.Dados);
  }

  [Fact]
  public void Executar_MovimentacaoVinculadaAInvestimento_EBloqueadaNaoRemovida()
  {
    var usuarioId = Guid.NewGuid();
    var investimentoId = Guid.NewGuid();
    var itemNormal = new Saida("Mercado", "", 100m, new DateTime(2026, 8, 1), usuarioId);
    var itemInvestimento = new Entrada(
        "Aporte", "", 500m, new DateTime(2026, 8, 3), usuarioId, investimentoId: investimentoId);

    var repository = new InMemoryMovimentacaoRepository(new Movimentacao[] { itemNormal, itemInvestimento });
    var useCase = new RemoverMovimentacoesEmLoteUseCase(repository);

    var resultado = useCase.Executar(new[] { itemNormal.Id, itemInvestimento.Id });

    Assert.Equal(2, resultado.TotalSolicitado);
    Assert.Equal(1, resultado.TotalRemovido);
    Assert.Equal(new[] { itemInvestimento.Id }, resultado.IdsBloqueados);
    Assert.Single(repository.Dados);
    Assert.Equal(itemInvestimento.Id, repository.Dados[0].Id);
  }

  [Fact]
  public void Executar_ListaVazia_DeveFalhar()
  {
    var repository = new InMemoryMovimentacaoRepository();
    var useCase = new RemoverMovimentacoesEmLoteUseCase(repository);

    Assert.Throws<ArgumentException>(() => useCase.Executar(Array.Empty<Guid>()));
  }

  [Fact]
  public void Executar_IdsDuplicados_ContaUmaVezSo()
  {
    var usuarioId = Guid.NewGuid();
    var item1 = new Saida("Mercado", "", 100m, new DateTime(2026, 8, 1), usuarioId);

    var repository = new InMemoryMovimentacaoRepository(new Movimentacao[] { item1 });
    var useCase = new RemoverMovimentacoesEmLoteUseCase(repository);

    var resultado = useCase.Executar(new[] { item1.Id, item1.Id });

    Assert.Equal(1, resultado.TotalSolicitado);
    Assert.Equal(1, resultado.TotalRemovido);
  }

  private sealed class InMemoryMovimentacaoRepository : IMovimentacaoRepository
  {
    private readonly List<Movimentacao> _dados;

    public InMemoryMovimentacaoRepository(IEnumerable<Movimentacao>? dadosIniciais = null)
    {
      _dados = dadosIniciais?.ToList() ?? new List<Movimentacao>();
    }

    public IReadOnlyList<Movimentacao> Dados => _dados;

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
    public IEnumerable<Movimentacao> ListarPorCartaoECompetencia(Guid usuarioId, Guid cartaoId, int competencia)
        => Enumerable.Empty<Movimentacao>();
    public IEnumerable<Movimentacao> ListarUltimaOcorrenciaDosGruposExpirados(Guid usuarioId, DateTime referencia)
        => Enumerable.Empty<Movimentacao>();
    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes) { }
    public void RemoverEmLote(IEnumerable<Movimentacao> movimentacoes)
    {
      foreach (var item in movimentacoes)
      {
        _dados.Remove(item);
      }
    }
  }
}
