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
    var useCase = new CriarMovimentacaoUseCase(repository, new InMemoryCartaoRepository());

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
    var useCase = new CriarMovimentacaoUseCase(repository, new InMemoryCartaoRepository());

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

  [Fact]
  public void ListarGruposRecorrenciaExpirados_DeveRetornarApenasGruposComUltimaOcorrenciaNoPassado()
  {
    var usuarioId = Guid.NewGuid();
    var grupoExpiradoId = Guid.NewGuid();
    var grupoAtivoId = Guid.NewGuid();

    var expirado = new Saida(
        "Aluguel 12/12",
        "Fixa",
        1500m,
        DateTime.Today.AddMonths(-1),
        usuarioId,
        fixa: true,
        periodo: 12,
        grupoRecorrenciaId: grupoExpiradoId,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.Parcelada);

    var ativo = new Entrada(
        "Salário",
        "Mensal",
        5000m,
        DateTime.Today.AddMonths(1),
        usuarioId,
        fixa: true,
        periodo: 2,
        grupoRecorrenciaId: grupoAtivoId,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.RecorrenteFixa);

    var repository = new InMemoryMovimentacaoRepository(new Movimentacao[] { expirado, ativo });
    var useCase = new ListarGruposRecorrenciaExpiradosUseCase(repository);

    var resultado = useCase.Executar(usuarioId).ToList();

    var grupo = Assert.Single(resultado);
    Assert.Equal(grupoExpiradoId, grupo.GrupoRecorrenciaId);
    Assert.Equal("Aluguel", grupo.Titulo);
  }

  [Fact]
  public void RenovarGrupoRecorrencia_Parcelada_DeveCriarNovasOcorrenciasERenumerar()
  {
    var usuarioId = Guid.NewGuid();
    var grupoId = Guid.NewGuid();

    var movimentacoes = Enumerable.Range(1, 3)
        .Select(i => (Movimentacao)new Saida(
            $"Notebook {i}/3",
            "Compra no cartão",
            1500m,
            new DateTime(2026, 1, 1).AddMonths(i - 1),
            usuarioId,
            fixa: true,
            periodo: 3,
            grupoRecorrenciaId: grupoId,
            tipoMovimentacaoFixa: TipoMovimentacaoFixa.Parcelada))
        .ToArray();

    var repository = new InMemoryMovimentacaoRepository(movimentacoes);
    var renumerarGrupoUseCase = new RenumerarGrupoUseCase(repository);
    var useCase = new RenovarGrupoRecorrenciaUseCase(repository, renumerarGrupoUseCase, new InMemoryCartaoRepository());

    var resultado = useCase.Executar(grupoId, usuarioId, 2);

    Assert.Equal(2, resultado.TotalCriado);
    Assert.Equal(new DateTime(2026, 5, 1), resultado.NovaUltimaData);

    var grupoCompleto = repository.ListarPorGrupoRecorrencia(grupoId, usuarioId)
        .OrderBy(m => m.Data)
        .ToList();

    Assert.Equal(5, grupoCompleto.Count);
    Assert.Equal("Notebook 1/5", grupoCompleto[0].Titulo);
    Assert.Equal("Notebook 5/5", grupoCompleto[4].Titulo);
    Assert.Equal(new DateTime(2026, 5, 1), grupoCompleto[4].Data);
  }

  [Fact]
  public void RenovarGrupoRecorrencia_RecorrenteFixa_DeveManterTituloSemNumeracao()
  {
    var usuarioId = Guid.NewGuid();
    var grupoId = Guid.NewGuid();

    var original = new Entrada(
        "Salário",
        "Mensal",
        5000m,
        new DateTime(2026, 1, 5),
        usuarioId,
        fixa: true,
        periodo: 1,
        grupoRecorrenciaId: grupoId,
        tipoMovimentacaoFixa: TipoMovimentacaoFixa.RecorrenteFixa);

    var repository = new InMemoryMovimentacaoRepository(new Movimentacao[] { original });
    var renumerarGrupoUseCase = new RenumerarGrupoUseCase(repository);
    var useCase = new RenovarGrupoRecorrenciaUseCase(repository, renumerarGrupoUseCase, new InMemoryCartaoRepository());

    useCase.Executar(grupoId, usuarioId, 3);

    Assert.All(
        repository.ListarPorGrupoRecorrencia(grupoId, usuarioId),
        item => Assert.Equal("Salário", item.Titulo));
    Assert.False(repository.AtualizacaoEmLoteExecutada);
  }

  [Fact]
  public void RenovarGrupoRecorrencia_MesesInvalido_DeveFalhar()
  {
    var repository = new InMemoryMovimentacaoRepository();
    var useCase = new RenovarGrupoRecorrenciaUseCase(repository, new RenumerarGrupoUseCase(repository), new InMemoryCartaoRepository());

    Assert.Throws<ArgumentException>(() => useCase.Executar(Guid.NewGuid(), Guid.NewGuid(), 0));
  }

  [Fact]
  public void RenovarGrupoRecorrencia_GrupoInexistente_DeveFalhar()
  {
    var repository = new InMemoryMovimentacaoRepository();
    var useCase = new RenovarGrupoRecorrenciaUseCase(repository, new RenumerarGrupoUseCase(repository), new InMemoryCartaoRepository());

    Assert.Throws<KeyNotFoundException>(() => useCase.Executar(Guid.NewGuid(), Guid.NewGuid(), 1));
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

    public IEnumerable<Movimentacao> ListarPorPeriodoPorUsuario(DateTime dataInicio, DateTime dataFim, Guid usuarioId)
      => _dados.Where(m => m.UsuarioId == usuarioId && m.Data >= dataInicio && m.Data <= dataFim);

    public IEnumerable<Movimentacao> ListarPorGrupoRecorrencia(Guid grupoRecorrenciaId, Guid usuarioId)
    {
      return _dados.Where(m => m.GrupoRecorrenciaId == grupoRecorrenciaId && m.UsuarioId == usuarioId);
    }

    public IEnumerable<Movimentacao> ListarUltimaOcorrenciaDosGruposExpirados(Guid usuarioId, DateTime referencia)
    {
      return _dados
          .Where(m => m.UsuarioId == usuarioId && m.Fixa && m.GrupoRecorrenciaId != null)
          .GroupBy(m => m.GrupoRecorrenciaId)
          .Select(g => g.OrderByDescending(m => m.Data).ThenByDescending(m => m.Id).First())
          .Where(m => m.Data < referencia);
    }

    public IEnumerable<Movimentacao> ListarPorCartaoECompetencia(Guid usuarioId, Guid cartaoId, int competencia)
    {
      return Enumerable.Empty<Movimentacao>();
    }

    public void AtualizarEmLote(IEnumerable<Movimentacao> movimentacoes)
    {
      AtualizacaoEmLoteExecutada = true;
    }

    public void RemoverEmLote(IEnumerable<Movimentacao> movimentacoes)
    {
      foreach (var item in movimentacoes)
      {
        Remover(item);
      }
    }

  }

  private sealed class InMemoryCartaoRepository : ICartaoRepository
  {
    private readonly Dictionary<Guid, CartaoManual> _cartoes;

    public InMemoryCartaoRepository(IEnumerable<CartaoManual>? cartoes = null)
    {
      _cartoes = (cartoes ?? Enumerable.Empty<CartaoManual>()).ToDictionary(c => c.Id);
    }

    public void Adicionar(CartaoManual cartao) => _cartoes[cartao.Id] = cartao;

    public void Atualizar(CartaoManual cartao) => _cartoes[cartao.Id] = cartao;

    public CartaoManual? ObterAtivoPorUsuario(Guid usuarioId) =>
      _cartoes.Values.FirstOrDefault(c => c.UsuarioId == usuarioId && c.Ativo);

    public CartaoManual? ObterPorId(Guid id, Guid usuarioId) =>
      _cartoes.TryGetValue(id, out var cartao) && cartao.UsuarioId == usuarioId ? cartao : null;

    public IReadOnlyCollection<CartaoManual> ListarPorUsuario(Guid usuarioId, bool incluirInativos = true) =>
      _cartoes.Values.Where(c => c.UsuarioId == usuarioId && (incluirInativos || c.Ativo)).ToList();

    public IReadOnlyCollection<CartaoManual> ListarAtivosPorUsuario(Guid usuarioId) =>
      _cartoes.Values.Where(c => c.UsuarioId == usuarioId && c.Ativo).ToList();

    public int ContarCartoesAtivos(Guid usuarioId, Guid? ignorarCartaoId = null) =>
      _cartoes.Values.Count(c => c.UsuarioId == usuarioId && c.Ativo && c.Id != ignorarCartaoId);

    public (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(
      Guid cartaoId, DateTime referenciaUtc, int diaFechamento) => (0, 0);

    public decimal ObterFaturaPorCompetencia(Guid cartaoId, int competencia) => 0;
  }
}