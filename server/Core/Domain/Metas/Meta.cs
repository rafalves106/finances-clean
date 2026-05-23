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

  protected Meta() { }

  public Meta(string descricao, decimal valor, Guid usuarioId, DateTime? dataAlvo = null)
  {
    if (string.IsNullOrWhiteSpace(descricao))
      throw new ArgumentException("Descrição é obrigatória.", nameof(descricao));
    if (valor <= 0)
      throw new ArgumentException("O valor deve ser maior que zero.", nameof(valor));

    Id = Guid.NewGuid();
    UsuarioId = usuarioId;
    Descricao = descricao;
    Valor = valor;
    DataAlvo = dataAlvo;
    Concluida = false;
    DataCriacao = DateTime.UtcNow;
  }

  public void Atualizar(string descricao, decimal valor, DateTime? dataAlvo)
  {
    if (string.IsNullOrWhiteSpace(descricao))
      throw new ArgumentException("Descrição é obrigatória.", nameof(descricao));
    if (valor <= 0)
      throw new ArgumentException("O valor deve ser maior que zero.", nameof(valor));

    Descricao = descricao;
    Valor = valor;
    DataAlvo = dataAlvo;
  }

  public void AlternarConclusao() => Concluida = !Concluida;
}