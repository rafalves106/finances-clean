using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

public class MovimentacaoParcelamentoUseCaseTests
{
  [Fact]
  public void CriarMovimentacao_Parcelada_DeveNumerarTitulos()
  {
    var repository = new InMemoryMovimentacaoRepository();
    var useCase = new CriarMovimentacaoUseCase(repository);

    var movimentacao = new Saida(
        "Notebook",
        "Compra no cartão",
        4500m,
        new DateTime(2026, 1, 10),
        Guid.NewGuid(),
        fixa: true,
        periodo: 3,
        tipoRecorrencia: TipoRecorrencia.Mensal,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.Parcelada);

    useCase.Executar(movimentacao);

    Assert.Equal(3, repository.Adicionados.Count);
    Assert.Equal("Notebook 1/3", repository.Adicionados[0].Titulo);
    Assert.Equal("Notebook 2/3", repository.Adicionados[1].Titulo);
    Assert.Equal("Notebook 3/3", repository.Adicionados[2].Titulo);
  }

  [Fact]
  public void CriarMovimentacao_RecorrenteFixa_DeveManterTituloSemNumeracao()
  {
    var repository = new InMemoryMovimentacaoRepository();
    var useCase = new CriarMovimentacaoUseCase(repository);

    var movimentacao = new Entrada(
        "Salário",
        "Mensal",
        10000m,
        new DateTime(2026, 1, 5),
        Guid.NewGuid(),
        fixa: true,
        periodo: 2,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.RecorrenteFixa);

    useCase.Executar(movimentacao);

    Assert.Equal(2, repository.Adicionados.Count);
    Assert.All(repository.Adicionados, item => Assert.Equal("Salário", item.Titulo));
  }

  [Fact]
  public void CriarMovimentacao_PeriodoInvalido_DeveFalhar()
  {
    Assert.Throws<ArgumentException>(() =>
        new Entrada(
            "Teste",
            "Inválido",
            100m,
            new DateTime(2026, 1, 1),
            Guid.NewGuid(),
            fixa: true,
            periodo: 0));
  }

  [Fact]
  public void RenumerarGrupo_DeveNormalizarETornarSequenciaDeterministica()
  {
    var usuarioId = Guid.NewGuid();
    var grupoId = Guid.NewGuid();

    var primeiro = new Saida(
        "Bateria 2/12",
        "Troca",
        400m,
        new DateTime(2026, 2, 1),
        usuarioId,
        fixa: true,
        periodo: 3,
        grupoRecorrenciaId: grupoId,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.Parcelada);

    var segundo = new Saida(
        "Bateria",
        "Troca",
        400m,
        new DateTime(2026, 1, 1),
        usuarioId,
        fixa: true,
        periodo: 3,
        grupoRecorrenciaId: grupoId,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.Parcelada);

    var terceiro = new Saida(
        "Bateria 8/9",
        "Troca",
        400m,
        new DateTime(2026, 3, 1),
        usuarioId,
        fixa: true,
        periodo: 3,
        grupoRecorrenciaId: grupoId,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.Parcelada);

    var repository = new InMemoryMovimentacaoRepository(new[] { primeiro, segundo, terceiro });
    var useCase = new RenumerarGrupoUseCase(repository);

    var resultado = useCase.Executar(grupoId, usuarioId);

    Assert.Equal(3, resultado.TotalAtualizado);
    Assert.Equal("Bateria 1/3", segundo.Titulo);
    Assert.Equal("Bateria 2/3", primeiro.Titulo);
    Assert.Equal("Bateria 3/3", terceiro.Titulo);
    Assert.True(repository.AtualizacaoEmLoteExecutada);
  }

  [Fact]
  public void RenumerarGrupo_GrupoInexistente_DeveFalhar()
  {
    var repository = new InMemoryMovimentacaoRepository();
    var useCase = new RenumerarGrupoUseCase(repository);

    Assert.Throws<KeyNotFoundException>(() => useCase.Executar(Guid.NewGuid(), Guid.NewGuid()));
  }

  private sealed class InMemoryMovimentacaoRepository : IMovimentacaoRepository
  {
    private readonly List<Movimentacao> _dados;

    public InMemoryMovimentacaoRepository(IEnumerable<Movimentacao>? dadosIniciais = null)
    {
      _dados = dadosIniciais?.ToList() ?? new List<Movimentacao>();
    }

    public List<Movimentacao> Adicionados { get; } = new();
    public bool AtualizacaoEmLoteExecutada { get; private set; }

    public Guid Adicionar(Movimentacao movimentacao)
    {
      _dados.Add(movimentacao);
      Adicionados.Add(movimentacao);
      return movimentacao.Id;
    }

    public IEnumerable<Movimentacao> ListarTodas(int? mes = null, int? ano = null) => _dados;

    public IEnumerable<Movimentacao> ListarPorMes(int mes, int ano) => _dados.Where(m => m.Data.Month == mes && m.Data.Year == ano);

    public void Remover(Movimentacao movimentacao) => _dados.Remove(movimentacao);

    public void Atualizar(Movimentacao movimentacao)
    {
      // Sem necessidade para os cenários cobertos.
    }

    public Movimentacao? ObterPorId(Guid id) => _dados.FirstOrDefault(m => m.Id == id);

    public IEnumerable<Entrada> ListarEntradas() => _dados.OfType<Entrada>();

    public IEnumerable<Saida> ListarSaidas() => _dados.OfType<Saida>();

    public IEnumerable<Movimentacao> ListarPorPeriodo(DateTime dataInicio, DateTime dataFim) => _dados.Where(m => m.Data >= dataInicio && m.Data <= dataFim);

    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId)
    {
      return _dados.Where(m => m.GrupoRecorrenciaId == grupoRecorrenciaId && m.UsuarioId == usuarioId);
    }

    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes)
    {
      AtualizacaoEmLoteExecutada = true;
    }

    public decimal ObterSaldoAcumulado(int mes, int ano) => 0m;
  }
}