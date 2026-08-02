namespace Finance.Core.Application.DTOs;

public record RemoverMovimentacoesEmLoteDTO(IReadOnlyList<Guid> Ids);
