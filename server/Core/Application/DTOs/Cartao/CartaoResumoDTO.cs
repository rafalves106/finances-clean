namespace Finance.Core.Application.DTOs;

public record CartaoResumoDTO(
    CartaoManualResumoDTO Cartao,
    CartaoLimiteResumoDTO Limite,
    CartaoPrevisaoFaturaDTO PrevisaoFatura
);

public record CartaoManualResumoDTO(
    Guid Id,
    string Nome,
    decimal LimiteTotal,
    int DiaFechamento,
    int DiaVencimento,
    string? CorTema,
    bool Ativo,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc
);

public record CartaoLimiteResumoDTO(
    decimal Utilizado,
    decimal Disponivel,
    decimal PercentualUso
);

public record CartaoPrevisaoFaturaDTO(
    decimal Atual,
    decimal Proxima
);
