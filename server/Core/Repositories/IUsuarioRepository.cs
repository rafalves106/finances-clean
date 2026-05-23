using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface IUsuarioRepository
{
  Usuario? BuscarPorEmail(string email);
  bool ExistePorEmail(string email);
  void Adicionar(Usuario usuario);
}
