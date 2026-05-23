namespace Finance.Core.Domain;

public class Veiculo
{
  public Guid Id { get; private set; }
  public Guid UsuarioId { get; private set; }
  public string Nome { get; private set; } = null!;
  public string Marca { get; private set; } = null!;
  public string Modelo { get; private set; } = null!;
  public int Ano { get; private set; }
  public string Placa { get; private set; } = null!;
  public int AlertaKm { get; private set; }
  public int UltimoKmAlerta { get; private set; }

  protected Veiculo() { }

  public Veiculo(string nome, string marca, string modelo, int ano, string placa, int alertaKm, Guid usuarioId)
  {
    Validar(nome, marca, modelo, ano, placa, alertaKm);

    Id = Guid.NewGuid();
    UsuarioId = usuarioId;
    Nome = nome;
    Marca = marca;
    Modelo = modelo;
    Ano = ano;
    Placa = placa;
    AlertaKm = alertaKm;
    UltimoKmAlerta = 0;
  }

  public void Atualizar(string nome, string marca, string modelo, int ano, string placa, int alertaKm)
  {
    Validar(nome, marca, modelo, ano, placa, alertaKm);

    Nome = nome;
    Marca = marca;
    Modelo = modelo;
    Ano = ano;
    Placa = placa;
    AlertaKm = alertaKm;
  }

  public void AtualizarUltimoKmAlerta(int km)
  {
    if (km < 0)
      throw new ArgumentException("A quilometragem não pode ser negativa.", nameof(km));

    UltimoKmAlerta = km;
  }

  private static void Validar(string nome, string marca, string modelo, int ano, string placa, int alertaKm)
  {
    if (string.IsNullOrWhiteSpace(nome))
      throw new ArgumentException("Nome é obrigatório.", nameof(nome));

    if (nome.Length > 100)
      throw new ArgumentException("O nome deve ter no máximo 100 caracteres.", nameof(nome));

    if (string.IsNullOrWhiteSpace(marca))
      throw new ArgumentException("Marca é obrigatória.", nameof(marca));

    if (marca.Length > 100)
      throw new ArgumentException("A marca deve ter no máximo 100 caracteres.", nameof(marca));

    if (string.IsNullOrWhiteSpace(modelo))
      throw new ArgumentException("Modelo é obrigatório.", nameof(modelo));

    if (modelo.Length > 100)
      throw new ArgumentException("O modelo deve ter no máximo 100 caracteres.", nameof(modelo));

    if (ano < 1886 || ano > DateTime.UtcNow.Year + 1)
      throw new ArgumentException("O ano do veículo é inválido.", nameof(ano));

    if (string.IsNullOrWhiteSpace(placa))
      throw new ArgumentException("Placa é obrigatória.", nameof(placa));

    if (placa.Length > 10)
      throw new ArgumentException("A placa deve ter no máximo 10 caracteres.", nameof(placa));

    if (alertaKm <= 0)
      throw new ArgumentException("O intervalo de alerta deve ser maior que zero.", nameof(alertaKm));
  }
}
