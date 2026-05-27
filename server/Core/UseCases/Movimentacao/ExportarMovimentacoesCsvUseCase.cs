using System.Globalization;
using System.Text;
using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class ExportarMovimentacoesCsvUseCase(IMovimentacaoRepository movimentacaoRepository, IVeiculoRepository veiculoRepository)
{
  public ExportacaoMovimentacoesCsvResultado Executar(Guid usuarioId, DateTime dataInicio, DateTime dataFim)
  {
    var dataInicioNormalizada = dataInicio.Date;
    var dataFimNormalizada = dataFim.Date;

    if (dataInicioNormalizada > dataFimNormalizada)
    {
      throw new ArgumentException("A data de início deve ser menor ou igual à data de fim.");
    }

    if (dataFimNormalizada > dataInicioNormalizada.AddMonths(36))
    {
      throw new ArgumentException("A janela máxima de exportação é de 36 meses.");
    }

    var inicioPeriodo = dataInicioNormalizada;
    var fimPeriodo = dataFimNormalizada.AddDays(1).AddTicks(-1);

    var movimentacoes = movimentacaoRepository
        .ListarPorPeriodoPorUsuario(inicioPeriodo, fimPeriodo, usuarioId)
        .ToList();

    var veiculosPorId = veiculoRepository
        .ListarTodos()
      .Where(v => v.UsuarioId == usuarioId)
        .ToDictionary(v => v.Id, v => v.Nome);

    var builder = new StringBuilder();
    builder.AppendLine("Data;Titulo;Tipo;Categoria;Valor;Veiculo");

    foreach (var movimentacao in movimentacoes)
    {
      var tipoLegivel = movimentacao.Tipo == TipoMovimentacao.Entrada ? "Receita" : "Despesa";
      var categoria = movimentacao.Categoria?.Nome ?? string.Empty;
      var veiculo = movimentacao.VeiculoId.HasValue && veiculosPorId.TryGetValue(movimentacao.VeiculoId.Value, out var nomeVeiculo)
          ? nomeVeiculo
          : string.Empty;

      var linha = string.Join(";", new[]
      {
                EscapeCsv(movimentacao.Data.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)),
                EscapeCsv(movimentacao.Titulo),
                EscapeCsv(tipoLegivel),
                EscapeCsv(categoria),
                EscapeCsv(movimentacao.Valor.ToString("0.00", CultureInfo.InvariantCulture)),
                EscapeCsv(veiculo)
            });

      builder.AppendLine(linha);
    }

    var conteudoSemBom = Encoding.UTF8.GetBytes(builder.ToString());
    var bom = Encoding.UTF8.GetPreamble();
    var conteudo = new byte[bom.Length + conteudoSemBom.Length];

    Buffer.BlockCopy(bom, 0, conteudo, 0, bom.Length);
    Buffer.BlockCopy(conteudoSemBom, 0, conteudo, bom.Length, conteudoSemBom.Length);

    var nomeArquivo = $"movimentacoes_{dataInicioNormalizada:yyyyMMdd}_{dataFimNormalizada:yyyyMMdd}.csv";

    return new ExportacaoMovimentacoesCsvResultado(conteudo, nomeArquivo);
  }

  private static string EscapeCsv(string? valor)
  {
    if (string.IsNullOrEmpty(valor))
    {
      return string.Empty;
    }

    var precisaEscapar = valor.Contains(';') ||
                        valor.Contains(',') ||
                        valor.Contains('"') ||
                        valor.Contains('\n') ||
                        valor.Contains('\r');

    if (!precisaEscapar)
    {
      return valor;
    }

    return $"\"{valor.Replace("\"", "\"\"")}\"";
  }
}