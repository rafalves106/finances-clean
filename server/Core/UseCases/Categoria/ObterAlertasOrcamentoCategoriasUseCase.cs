using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ObterAlertasOrcamentoCategoriasUseCase(
  ICategoriaRepository categoriaRepository,
  IMovimentacaoRepository movimentacaoRepository)
{
  public ResumoAlertasOrcamentoCategoriasDTO Executar(Guid usuarioId, int mes, int ano)
  {
    if (mes < 1 || mes > 12)
      throw new ArgumentException("O mês deve estar entre 1 e 12.", nameof(mes));

    if (ano < 1)
      throw new ArgumentException("O ano é inválido.", nameof(ano));

    var categorias = categoriaRepository.ListarTodas().ToList();
    var categoriasGlobaisIds = categorias
      .Where(categoria => categoria.IsGlobal)
      .Select(categoria => categoria.Id)
      .ToList();

    var orcamentosGlobaisEfetivos = categoriaRepository
      .ListarOrcamentosMensaisCategoriasGlobais(usuarioId, categoriasGlobaisIds);

    var categoriasComOrcamento = categorias
      .Select(categoria => new
      {
        Categoria = categoria,
        OrcamentoMensal = categoria.IsGlobal
          ? (orcamentosGlobaisEfetivos.TryGetValue(categoria.Id, out var orcamentoGlobal) ? orcamentoGlobal : (decimal?)null)
          : categoria.OrcamentoMensal
      })
      .Where(item => item.OrcamentoMensal.HasValue)
      .ToList();

    var inicioMes = new DateTime(ano, mes, 1);
    var fimMes = inicioMes.AddMonths(1).AddTicks(-1);

    var despesasPorCategoria = movimentacaoRepository
      .ListarPorPeriodoPorUsuario(inicioMes, fimMes, usuarioId)
      .Where(item => item.Tipo == TipoMovimentacao.Saida && item.InvestimentoId is null && item.CategoriaId.HasValue)
      .GroupBy(item => item.CategoriaId)
      .ToDictionary(grupo => grupo.Key!.Value, grupo => grupo.Sum(mov => mov.Valor));

    var alertas = categoriasComOrcamento
      .Select(item =>
      {
        var totalDespesas = despesasPorCategoria.GetValueOrDefault(item.Categoria.Id, 0m);
        var orcamentoMensal = item.OrcamentoMensal!.Value;
        var percentualConsumo = orcamentoMensal == 0
          ? 0
          : Math.Round((totalDespesas / orcamentoMensal) * 100, 2);

        var estadoAlerta = percentualConsumo switch
        {
          >= 100 => "Estourado",
          >= 80 => "Atencao",
          _ => "Normal"
        };

        return new OrcamentoCategoriaAlertaDTO(
          item.Categoria.Id,
          item.Categoria.Nome,
          item.Categoria.Icone,
          item.Categoria.Cor,
          orcamentoMensal,
          totalDespesas,
          percentualConsumo,
          estadoAlerta
        );
      })
      .OrderByDescending(item => item.PercentualConsumo)
      .ThenBy(item => item.Nome)
      .ToList();

    var totalCategoriasEmAlerta = alertas.Count(item => item.PercentualConsumo >= 80);

    return new ResumoAlertasOrcamentoCategoriasDTO(
      mes,
      ano,
      totalCategoriasEmAlerta,
      alertas
    );
  }
}