namespace Finance.Core.Application.DTOs;

public record MetaDTO(
string Descricao,
decimal Valor,
DateTime? DataAlvo,
Guid? CategoriaId = null,
Guid? InvestimentoId = null
);

public record MetaResponseDTO(
Guid Id,
string Descricao,
decimal Valor,
DateTime? DataAlvo,
bool Concluida,
DateTime DataCriacao,
Guid? CategoriaId,
Guid? InvestimentoId,
decimal ValorAcumulado,
decimal PercentualProgresso
);