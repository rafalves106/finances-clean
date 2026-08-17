namespace Finance.Core.Application.DTOs;

public record ImportacaoMovimentacaoCsvErroDTO(int Linha, string Motivo);

public record ImportacaoMovimentacoesCsvResultado(
    int TotalLinhas,
    int Importadas,
    IEnumerable<ImportacaoMovimentacaoCsvErroDTO> Erros
);
