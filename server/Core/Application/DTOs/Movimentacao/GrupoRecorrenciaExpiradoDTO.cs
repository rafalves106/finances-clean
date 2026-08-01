using Finance.Core.Domain;

namespace Finance.Core.Application.DTOs;

public record GrupoRecorrenciaExpiradoDTO(Guid GrupoRecorrenciaId, string Titulo, DateTime UltimaData, TipoRecorrencia TipoRecorrencia);
