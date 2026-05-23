using Finance.Core.Domain;
using Finance.Core.Repositories;
using Finance.Infrastructure.Data;

namespace Finance.Infrastructure.Repositories;

public class UsuarioRepository(FinanceDbContext _context) : IUsuarioRepository
{
    public Usuario? BuscarPorEmail(string email) =>
        _context.Usuarios
            .FirstOrDefault(u => u.Email == email.ToLower().Trim());

    public bool ExistePorEmail(string email) =>
_context.Usuarios
  .Any(u => u.Email == email.ToLower().Trim());

    public void Adicionar(Usuario usuario)
    {
        _context.Usuarios.Add(usuario);
        _context.SaveChanges();
    }
}