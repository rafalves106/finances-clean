using System.Globalization;
using System.Text;
using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

// Importa o mesmo formato que ExportarMovimentacoesCsvUseCase gera
// (Data;Titulo;Tipo;Categoria;Valor;Veiculo) - o complemento natural da
// exportação, não um leitor de extrato bancário genérico. Uma linha ruim
// não aborta o lote inteiro: cada linha é validada e reportada
// separadamente, o resto continua importando.
public class ImportarMovimentacoesCsvUseCase(
    IMovimentacaoRepository movimentacaoRepository,
    ICategoriaRepository categoriaRepository,
    IVeiculoRepository veiculoRepository)
{
  private static readonly string[] FormatosData = { "yyyy-MM-dd", "dd/MM/yyyy" };

  public ImportacaoMovimentacoesCsvResultado Executar(Guid usuarioId, string conteudoCsv)
  {
    var linhas = (conteudoCsv ?? string.Empty)
        .Split('\n')
        .Select(l => l.TrimEnd('\r'))
        .Where(l => l.Trim().Length > 0)
        .ToList();

    if (linhas.Count > 0 && linhas[0].TrimStart().StartsWith("Data;", StringComparison.OrdinalIgnoreCase))
    {
      linhas.RemoveAt(0);
    }

    var categoriasPorNome = categoriaRepository.ListarTodas()
        .Where(c => c.UsuarioId == usuarioId)
        .GroupBy(c => c.Nome.Trim(), StringComparer.OrdinalIgnoreCase)
        .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);

    var veiculosPorNome = veiculoRepository.ListarTodos()
        .Where(v => v.UsuarioId == usuarioId)
        .GroupBy(v => v.Nome.Trim(), StringComparer.OrdinalIgnoreCase)
        .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);

    var erros = new List<ImportacaoMovimentacaoCsvErroDTO>();
    var importadas = 0;

    for (var i = 0; i < linhas.Count; i++)
    {
      var numeroLinha = i + 1;

      try
      {
        var movimentacao = ParsearLinha(linhas[i], usuarioId, categoriasPorNome, veiculosPorNome);
        movimentacaoRepository.Adicionar(movimentacao);
        importadas++;
      }
      catch (FormatException ex)
      {
        erros.Add(new ImportacaoMovimentacaoCsvErroDTO(numeroLinha, ex.Message));
      }
      catch (ArgumentException ex)
      {
        erros.Add(new ImportacaoMovimentacaoCsvErroDTO(numeroLinha, ex.Message));
      }
    }

    return new ImportacaoMovimentacoesCsvResultado(linhas.Count, importadas, erros);
  }

  private static Movimentacao ParsearLinha(
      string linha, Guid usuarioId,
      IReadOnlyDictionary<string, Guid> categoriasPorNome,
      IReadOnlyDictionary<string, Guid> veiculosPorNome)
  {
    var colunas = DividirLinhaCsv(linha);
    if (colunas.Count < 5)
    {
      throw new FormatException("Linha precisa de ao menos Data;Titulo;Tipo;Categoria;Valor.");
    }

    var data = ParsearData(colunas[0]);
    var titulo = colunas[1].Trim();
    if (titulo.Length == 0)
    {
      throw new FormatException("Título não pode ser vazio.");
    }

    var tipo = ParsearTipo(colunas[2]);
    var categoriaId = ObterIdPorNome(colunas[3], categoriasPorNome);
    var valor = ParsearValor(colunas[4]);
    var veiculoId = colunas.Count > 5 ? ObterIdPorNome(colunas[5], veiculosPorNome) : null;

    return tipo == TipoMovimentacao.Entrada
        ? new Entrada(titulo, null, valor, data, usuarioId, categoriaId: categoriaId, veiculoId: veiculoId)
        : new Saida(titulo, "", valor, data, usuarioId, categoriaId: categoriaId, veiculoId: veiculoId);
  }

  private static DateTime ParsearData(string valor)
  {
    if (DateTime.TryParseExact(valor.Trim(), FormatosData, CultureInfo.InvariantCulture, DateTimeStyles.None, out var data))
    {
      return data;
    }

    throw new FormatException($"Data inválida: \"{valor}\" (use AAAA-MM-DD ou DD/MM/AAAA).");
  }

  private static TipoMovimentacao ParsearTipo(string valor)
  {
    return valor.Trim().ToLowerInvariant() switch
    {
      "receita" or "entrada" => TipoMovimentacao.Entrada,
      "despesa" or "saida" or "saída" => TipoMovimentacao.Saida,
      _ => throw new FormatException($"Tipo inválido: \"{valor}\" (use Receita ou Despesa)."),
    };
  }

  private static decimal ParsearValor(string valor)
  {
    var normalizado = valor.Trim();
    if (decimal.TryParse(normalizado, NumberStyles.Number, CultureInfo.InvariantCulture, out var resultado) && resultado > 0)
    {
      return resultado;
    }

    // planilha editada localmente pode ter salvo com vírgula decimal
    if (decimal.TryParse(normalizado.Replace(".", "").Replace(",", "."), NumberStyles.Number, CultureInfo.InvariantCulture, out resultado) && resultado > 0)
    {
      return resultado;
    }

    throw new FormatException($"Valor inválido: \"{valor}\" (precisa ser um número maior que zero).");
  }

  private static Guid? ObterIdPorNome(string nome, IReadOnlyDictionary<string, Guid> porNome)
  {
    var normalizado = nome.Trim();
    if (normalizado.Length == 0)
    {
      return null;
    }

    return porNome.TryGetValue(normalizado, out var id) ? id : null;
  }

  private static List<string> DividirLinhaCsv(string linha)
  {
    var colunas = new List<string>();
    var atual = new StringBuilder();
    var dentroDeAspas = false;

    for (var i = 0; i < linha.Length; i++)
    {
      var c = linha[i];

      if (dentroDeAspas)
      {
        if (c == '"' && i + 1 < linha.Length && linha[i + 1] == '"')
        {
          atual.Append('"');
          i++;
        }
        else if (c == '"')
        {
          dentroDeAspas = false;
        }
        else
        {
          atual.Append(c);
        }
      }
      else if (c == '"')
      {
        dentroDeAspas = true;
      }
      else if (c == ';')
      {
        colunas.Add(atual.ToString());
        atual.Clear();
      }
      else
      {
        atual.Append(c);
      }
    }

    colunas.Add(atual.ToString());
    return colunas;
  }
}
