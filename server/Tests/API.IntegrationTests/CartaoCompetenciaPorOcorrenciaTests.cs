using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Core.UseCases;
using Xunit;

namespace API.IntegrationTests;

// Bug real encontrado em producao: dois problemas distintos, mas com a mesma
// raiz (tratar "mes selecionado" ou "competencia da 1a ocorrencia" como se
// fossem a competencia de FECHAMENTO, quando deveriam levar em conta o
// VENCIMENTO por ocorrencia).
public class CartaoCompetenciaPorOcorrenciaTests
{
  // Fechamento dia 28, vencimento dia 5 do mes seguinte (igual ao Cartao Neon
  // real que expos o bug): fatura que fecha em julho (competencia 202607)
  // vence em agosto; a que fecha em agosto (202608) vence em setembro.
  private static CartaoManual CriarCartao(Guid usuarioId) =>
    new(usuarioId, "Cartão Neon", 9000m, diaFechamento: 28, diaVencimento: 5);

  [Fact]
  public void ListarResumosCartoes_UtilizadoDoMesSelecionado_DeveSerAFaturaQueVenceNesseMes()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = CriarCartao(usuarioId);

    // Fecha em julho (28), vence em agosto.
    var compraFechaJulho = new Saida(
      "Gastos Cartão Neon", "", 542.15m, new DateTime(2026, 7, 15), usuarioId,
      cartaoId: cartao.Id, competenciaFatura: 202607);

    // Fecha em agosto (28), vence em setembro.
    var compraFechaAgosto = new Saida(
      "Cartão Neon", "", 496.32m, new DateTime(2026, 8, 10), usuarioId,
      cartaoId: cartao.Id, competenciaFatura: 202608);

    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao }, new[] { compraFechaJulho, compraFechaAgosto });
    var useCase = new ListarResumosCartoesUseCase(cartaoRepo);

    var resumoAgosto = useCase.Executar(usuarioId, 8, 2026).Single();
    var resumoSetembro = useCase.Executar(usuarioId, 9, 2026).Single();

    // Antes da correção, resumoAgosto.Limite.Utilizado vinha 496.32 (a fatura
    // que FECHA em agosto, mas só vence em setembro) - o valor errado.
    Assert.Equal(542.15m, resumoAgosto.Limite.Utilizado);
    Assert.Equal(496.32m, resumoSetembro.Limite.Utilizado);
  }

  [Fact]
  public void CriarMovimentacao_CompraParceladaNoCartao_CadaParcelaUsaAPropriaCompetencia()
  {
    var usuarioId = Guid.NewGuid();
    var cartao = CriarCartao(usuarioId);
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });
    var movRepo = new InMemoryMovimentacaoRepository();
    var useCase = new CriarMovimentacaoUseCase(movRepo, cartaoRepo);

    // 1ª parcela em 07/08 (fecha em agosto, competência 202608); 2ª parcela um
    // mês depois, em 07/09 (já depois do fechamento de agosto - fecha em
    // setembro, competência 202609). Antes da correção as duas herdavam
    // 202608 da primeira ocorrência.
    var compra = new Saida(
      "Pagamento Moto", "", 430.36m, new DateTime(2026, 8, 7), usuarioId,
      fixa: true, periodo: 2, tipoMovimentacaoFixa: TipoMovimentacaoFixa.Parcelada,
      cartaoId: cartao.Id, competenciaFatura: 202608);

    useCase.Executar(compra);

    Assert.Equal(2, movRepo.Adicionados.Count);
    Assert.Equal(202608, movRepo.Adicionados[0].CompetenciaFatura);
    Assert.Equal(202609, movRepo.Adicionados[1].CompetenciaFatura);
  }

  [Fact]
  public void RenovarGrupoRecorrencia_GrupoVinculadoACartao_NovaOcorrenciaUsaAPropriaCompetencia()
  {
    var usuarioId = Guid.NewGuid();
    var grupoId = Guid.NewGuid();
    var cartao = CriarCartao(usuarioId);
    var cartaoRepo = new InMemoryCartaoRepository(new[] { cartao });

    var ultimaOcorrencia = new Saida(
      "Assinatura", "", 100m, new DateTime(2026, 8, 7), usuarioId,
      fixa: true, periodo: 1, grupoRecorrenciaId: grupoId,
      cartaoId: cartao.Id, competenciaFatura: 202608);

    var movRepo = new InMemoryMovimentacaoRepository(new Movimentacao[] { ultimaOcorrencia });
    var renumerarGrupoUseCase = new RenumerarGrupoUseCase(movRepo);
    var useCase = new RenovarGrupoRecorrenciaUseCase(movRepo, renumerarGrupoUseCase, cartaoRepo);

    useCase.Executar(grupoId, usuarioId, 1);

    var novaOcorrencia = movRepo
      .ListarPorGrupoRecorrencia(grupoId, usuarioId)
      .Single(m => m.Id != ultimaOcorrencia.Id);

    Assert.Equal(new DateTime(2026, 9, 7), novaOcorrencia.Data);
    // Antes da correção, isso vinha 202608 (copiado da ultima ocorrencia).
    Assert.Equal(202609, novaOcorrencia.CompetenciaFatura);
  }

  private sealed class InMemoryMovimentacaoRepository : IMovimentacaoRepository
  {
    private readonly List<Movimentacao> _dados;

    public InMemoryMovimentacaoRepository(IEnumerable<Movimentacao>? dadosIniciais = null)
    {
      _dados = dadosIniciais?.ToList() ?? new List<Movimentacao>();
    }

    public List<Movimentacao> Adicionados { get; } = new();

    public Guid Adicionar(Movimentacao movimentacao)
    {
      _dados.Add(movimentacao);
      Adicionados.Add(movimentacao);
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

  private sealed class InMemoryCartaoRepository : ICartaoRepository
  {
    private readonly List<CartaoManual> _cartoes;
    private readonly List<Movimentacao> _movimentacoes;

    public InMemoryCartaoRepository(
      IEnumerable<CartaoManual>? cartoes = null, IEnumerable<Movimentacao>? movimentacoes = null)
    {
      _cartoes = cartoes?.ToList() ?? new List<CartaoManual>();
      _movimentacoes = movimentacoes?.ToList() ?? new List<Movimentacao>();
    }

    public void Adicionar(CartaoManual cartao) => _cartoes.Add(cartao);
    public void Atualizar(CartaoManual cartao) { }
    public CartaoManual? ObterAtivoPorUsuario(Guid usuarioId)
        => _cartoes.FirstOrDefault(c => c.UsuarioId == usuarioId && c.Ativo);
    public CartaoManual? ObterPorId(Guid id, Guid usuarioId)
        => _cartoes.FirstOrDefault(c => c.Id == id && c.UsuarioId == usuarioId);
    public IReadOnlyCollection<CartaoManual> ListarPorUsuario(Guid usuarioId, bool incluirInativos = true)
        => _cartoes.Where(c => c.UsuarioId == usuarioId && (incluirInativos || c.Ativo)).ToList();
    public IReadOnlyCollection<CartaoManual> ListarAtivosPorUsuario(Guid usuarioId)
        => _cartoes.Where(c => c.UsuarioId == usuarioId && c.Ativo).ToList();
    public int ContarCartoesAtivos(Guid usuarioId, Guid? ignorarCartaoId = null)
        => _cartoes.Count(c => c.UsuarioId == usuarioId && c.Ativo && c.Id != ignorarCartaoId);
    public (decimal faturaAtual, decimal faturaProxima) ObterPrevisaoFatura(Guid cartaoId, DateTime referenciaUtc, int diaFechamento)
        => (0m, 0m);
    public decimal ObterFaturaPorCompetencia(Guid cartaoId, int competencia)
        => _movimentacoes.Where(m => m.CartaoId == cartaoId && m.CompetenciaFatura == competencia).Sum(m => m.Valor);
  }
}
