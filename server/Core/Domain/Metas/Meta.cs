namespace Finance.Core.Domain;

public class Meta
{
  public Guid Id { get; private set; }
  public Guid UsuarioId { get; private set; }
  public string Descricao { get; private set; } = null!;
  public decimal Valor { get; private set; }
  public DateTime? DataAlvo { get; private set; }
  public bool Concluida { get; private set; }
  public DateTime DataCriacao { get; private set; }
  public Guid? CategoriaId { get; private set; }
  public Guid? InvestimentoId { get; private set; }

  protected Meta() { }

  public Meta(
    string descricao,
    decimal valor,
    Guid usuarioId,
    DateTime? dataAlvo = null,
    Guid? categoriaId = null,
    Guid? investimentoId = null)
  {
    if (string.IsNullOrWhiteSpace(descricao))
      throw new ArgumentException("Descrição é obrigatória.", nameof(descricao));
    if (valor <= 0)
      throw new ArgumentException("O valor deve ser maior que zero.", nameof(valor));
    if (categoriaId.HasValue && investimentoId.HasValue)
      throw new ArgumentException("Uma meta não pode estar vinculada a categoria e investimento ao mesmo tempo.");

    Id = Guid.NewGuid();
    UsuarioId = usuarioId;
    Descricao = descricao;
    Valor = valor;
    DataAlvo = dataAlvo;
    Concluida = false;
    DataCriacao = DateTime.UtcNow;
    CategoriaId = categoriaId;
    InvestimentoId = investimentoId;
  }

  public void Atualizar(
    string descricao,
    decimal valor,
    DateTime? dataAlvo,
    Guid? categoriaId = null,
    Guid? investimentoId = null)
  {
    if (string.IsNullOrWhiteSpace(descricao))
      throw new ArgumentException("Descrição é obrigatória.", nameof(descricao));
    if (valor <= 0)
      throw new ArgumentException("O valor deve ser maior que zero.", nameof(valor));
    if (categoriaId.HasValue && investimentoId.HasValue)
      throw new ArgumentException("Uma meta não pode estar vinculada a categoria e investimento ao mesmo tempo.");

    Descricao = descricao;
    Valor = valor;
    DataAlvo = dataAlvo;
    CategoriaId = categoriaId;
    InvestimentoId = investimentoId;
  }

  public void AlternarConclusao() => Concluida = !Concluida;
}