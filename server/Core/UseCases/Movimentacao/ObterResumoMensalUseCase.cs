using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;
using System.Globalization;
using System.Text;

namespace Finance.Core.UseCases;

public class ObterResumoMensalUseCase(IMovimentacaoRepository movimentacaoRepository)
{
    public ResumoMensalDTO Executar(int mes, int ano)
    {
        var movimentacoes = movimentacaoRepository.ListarPorMes(mes, ano)
            .Where(m => m.InvestimentoId is null)
            .ToList();

        var totalEntradas = movimentacoes
            .Where(m => m.Tipo == Finance.Core.Domain.TipoMovimentacao.Entrada)
            .Sum(m => m.Valor);

        var totalSaidas = movimentacoes
            .Where(m => m.Tipo == Finance.Core.Domain.TipoMovimentacao.Saida)
            .Sum(m => m.Valor);

        var rendaSalario = movimentacoes
          .Where(m => m.Tipo == Finance.Core.Domain.TipoMovimentacao.Entrada)
          .Where(m => Normalize(m.Categoria?.Nome) == "salario")
          .Sum(m => m.Valor);

        var porCategoria = movimentacoes
            .GroupBy(m => new
            {
                m.CategoriaId,
                Nome = m.Categoria?.Nome ?? "Sem categoria",
                m.Categoria?.Icone,
                m.Categoria?.Cor
            })
            .Select(grupo => new ResumoCategoriaDTO(
                grupo.Key.CategoriaId,
                grupo.Key.Nome,
                grupo.Key.Icone,
                grupo.Key.Cor,
                grupo.Where(m => m.Tipo == Finance.Core.Domain.TipoMovimentacao.Entrada).Sum(m => m.Valor),
                grupo.Where(m => m.Tipo == Finance.Core.Domain.TipoMovimentacao.Saida).Sum(m => m.Valor)
            ))
            .OrderBy(item => item.Nome)
            .ToList();

        return new ResumoMensalDTO(
            mes,
            ano,
            totalEntradas,
            totalSaidas,
            rendaSalario,
            totalEntradas - totalSaidas,
            porCategoria
        );
    }

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var ch in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC).Trim().ToLowerInvariant();
    }
}