namespace Finance.Core.Domain;

public class CategoriaOrcamentoUsuario
{
  public Guid Id { get; private set; }
  public Guid CategoriaGlobalId { get; private set; }
  public Guid UsuarioId { get; private set; }
  public decimal OrcamentoMensal { get; private set; }

  protected CategoriaOrcamentoUsuario() { }

  public CategoriaOrcamentoUsuario(Guid categoriaGlobalId, Guid usuarioId, decimal orcamentoMensal)
  {
    if (categoriaGlobalId == Guid.Empty)
      throw new ArgumentException("Categoria global inválida.", nameof(categoriaGlobalId));

    if (usuarioId == Guid.Empty)
      throw new ArgumentException("Usuário inválido.", nameof(usuarioId));

    if (orcamentoMensal <= 0)
      throw new ArgumentException("O orçamento mensal deve ser maior que zero.", nameof(orcamentoMensal));

    Id = Guid.NewGuid();
    CategoriaGlobalId = categoriaGlobalId;
    UsuarioId = usuarioId;
    OrcamentoMensal = orcamentoMensal;
  }

  public void AtualizarOrcamento(decimal orcamentoMensal)
  {
    if (orcamentoMensal <= 0)
      throw new ArgumentException("O orçamento mensal deve ser maior que zero.", nameof(orcamentoMensal));

    OrcamentoMensal = orcamentoMensal;
  }
}