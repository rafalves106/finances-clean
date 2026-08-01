using System.Globalization;
using System.Net;
using System.Text;
using Finance.Core.Application.DTOs;

namespace Finance.Core.UseCases;

public class GerarRelatorioMensalUseCase(
    ObterResumoMensalUseCase obterResumoMensalUseCase,
    ObterComparativoCategoriaMensalUseCase obterComparativoCategoriaMensalUseCase)
{
  private static readonly CultureInfo PtBr = new("pt-BR");

  public RelatorioMensalResultado Executar(Guid usuarioId, int mes, int ano)
  {
    var resumo = obterResumoMensalUseCase.Executar(mes, ano);

    var mesAnteriorReferencia = new DateTime(ano, mes, 1).AddMonths(-1);
    var comparativo = obterComparativoCategoriaMensalUseCase
        .Executar(usuarioId, mes, ano, meses: 3)
        .ToList();

    var saidasAtual = comparativo
        .Where(c => c.Mes == mes && c.Ano == ano)
        .ToDictionary(c => c.Categoria, c => c.TotalSaidas);

    var saidasAnterior = comparativo
        .Where(c => c.Mes == mesAnteriorReferencia.Month && c.Ano == mesAnteriorReferencia.Year)
        .ToDictionary(c => c.Categoria, c => c.TotalSaidas);

    var categoriasComparadas = saidasAtual.Keys
        .Union(saidasAnterior.Keys)
        .OrderByDescending(nome => saidasAtual.GetValueOrDefault(nome))
        .ToList();

    var topCategorias = resumo.PorCategoria
        .Where(c => c.TotalSaidas > 0)
        .OrderByDescending(c => c.TotalSaidas)
        .Take(5)
        .ToList();

    var html = MontarHtml(mes, ano, mesAnteriorReferencia, resumo, topCategorias, categoriasComparadas, saidasAtual, saidasAnterior);
    var nomeArquivo = $"relatorio_{ano}_{mes:D2}.html";

    return new RelatorioMensalResultado(Encoding.UTF8.GetBytes(html), nomeArquivo);
  }

  private static string MontarHtml(
      int mes,
      int ano,
      DateTime mesAnteriorReferencia,
      ResumoMensalDTO resumo,
      IReadOnlyList<ResumoCategoriaDTO> topCategorias,
      IReadOnlyList<string> categoriasComparadas,
      IReadOnlyDictionary<string, decimal> saidasAtual,
      IReadOnlyDictionary<string, decimal> saidasAnterior)
  {
    var nomeMes = PtBr.DateTimeFormat.GetMonthName(mes);
    var nomeMesAnterior = PtBr.DateTimeFormat.GetMonthName(mesAnteriorReferencia.Month);

    var sb = new StringBuilder();
    sb.Append("<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\">");
    sb.Append($"<title>Relatório de {nomeMes} de {ano}</title>");
    sb.Append("<style>");
    sb.Append("body{font-family:Arial,Helvetica,sans-serif;color:#1f2933;max-width:720px;margin:2rem auto;padding:0 1rem;}");
    sb.Append("h1{font-size:1.4rem;margin-bottom:0.25rem;}");
    sb.Append("h2{font-size:1.05rem;margin-top:2rem;border-bottom:1px solid #d7dce1;padding-bottom:0.25rem;}");
    sb.Append(".subtitulo{color:#6b7280;margin-top:0;}");
    sb.Append(".resumo{display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:1rem;}");
    sb.Append(".resumo div{background:#f5f6f8;border-radius:8px;padding:0.75rem 1rem;min-width:140px;}");
    sb.Append(".resumo strong{display:block;font-size:1.1rem;}");
    sb.Append("table{width:100%;border-collapse:collapse;margin-top:0.75rem;}");
    sb.Append("th,td{text-align:left;padding:0.4rem 0.5rem;border-bottom:1px solid #e5e7eb;}");
    sb.Append("th{color:#6b7280;font-weight:600;font-size:0.85rem;}");
    sb.Append(".valor{text-align:right;}");
    sb.Append(".positivo{color:#0f7a3c;}.negativo{color:#b91c1c;}");
    sb.Append("@media print{body{margin:0;}}");
    sb.Append("</style></head><body>");

    sb.Append($"<h1>Relatório financeiro — {nomeMes} de {ano}</h1>");
    sb.Append("<p class=\"subtitulo\">Gerado automaticamente a partir das movimentações do mês.</p>");

    sb.Append("<div class=\"resumo\">");
    sb.Append(ResumoItem("Receitas", resumo.TotalEntradas));
    sb.Append(ResumoItem("Despesas", resumo.TotalSaidas));
    sb.Append(ResumoItem("Saldo", resumo.Saldo));
    sb.Append(ResumoItem("Renda (salário)", resumo.RendaSalario));
    sb.Append("</div>");

    sb.Append("<h2>Top categorias de despesa</h2>");
    if (topCategorias.Count == 0)
    {
      sb.Append("<p>Nenhuma despesa registrada neste mês.</p>");
    }
    else
    {
      sb.Append("<table><thead><tr><th>Categoria</th><th class=\"valor\">Total gasto</th></tr></thead><tbody>");
      foreach (var categoria in topCategorias)
      {
        var icone = categoria.Icone is null ? string.Empty : WebUtility.HtmlEncode(categoria.Icone) + " ";
        sb.Append($"<tr><td>{icone}{WebUtility.HtmlEncode(categoria.Nome)}</td><td class=\"valor\">{FormatarMoeda(categoria.TotalSaidas)}</td></tr>");
      }
      sb.Append("</tbody></table>");
    }

    sb.Append($"<h2>Comparação com {nomeMesAnterior}</h2>");
    if (categoriasComparadas.Count == 0)
    {
      sb.Append("<p>Sem dados suficientes para comparação.</p>");
    }
    else
    {
      sb.Append($"<table><thead><tr><th>Categoria</th><th class=\"valor\">{nomeMes}</th><th class=\"valor\">{nomeMesAnterior}</th><th class=\"valor\">Variação</th></tr></thead><tbody>");
      foreach (var categoria in categoriasComparadas)
      {
        var atual = saidasAtual.GetValueOrDefault(categoria);
        var anterior = saidasAnterior.GetValueOrDefault(categoria);
        var variacao = anterior == 0 ? (atual == 0 ? 0 : 100) : Math.Round((atual - anterior) / anterior * 100, 1);
        var classeVariacao = variacao > 0 ? "negativo" : variacao < 0 ? "positivo" : string.Empty;
        sb.Append($"<tr><td>{WebUtility.HtmlEncode(categoria)}</td><td class=\"valor\">{FormatarMoeda(atual)}</td><td class=\"valor\">{FormatarMoeda(anterior)}</td><td class=\"valor {classeVariacao}\">{variacao:+0.#;-0.#;0}%</td></tr>");
      }
      sb.Append("</tbody></table>");
    }

    sb.Append("</body></html>");

    return sb.ToString();
  }

  private static string ResumoItem(string label, decimal valor) =>
      $"<div>{label}<strong>{FormatarMoeda(valor)}</strong></div>";

  private static string FormatarMoeda(decimal valor) => valor.ToString("C", PtBr);
}
