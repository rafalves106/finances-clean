namespace Finance.Core.Services;

public interface ICurrentUserService
{
  Guid? UsuarioId { get; }
}