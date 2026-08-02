namespace Finance.Core.Application.DTOs;

public record RemocaoEmLoteResultado(
    int TotalSolicitado,
    int TotalRemovido,
    IReadOnlyList<Guid> IdsNaoEncontrados,
    IReadOnlyList<Guid> IdsBloqueados
);
