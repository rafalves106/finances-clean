namespace Finance.Core.Domain;

public class Investimento
{
    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string Nome { get; private set; } = null!;
    public string Instituicao { get; private set; } = null!;
    public TipoInvestimento Tipo { get; private set; }

    public decimal ValorAplicado { get; private set; }
    public decimal ValorRetirado { get; private set; }
    public decimal SaldoAtual { get; private set; }

    public DateTime DataInicio { get; private set; }
    public DateTime? DataVencimento { get; private set; }

    public TipoRentabilidade TipoRentabilidade { get; private set; }
    public decimal? TaxaRendimento { get; private set; }
    public Liquidez Liquidez { get; private set; }

    public bool Ativo { get; private set; }

    private readonly List<TransacaoInvestimento> _transacoes = new();
    public IReadOnlyCollection<TransacaoInvestimento> Transacoes => _transacoes.AsReadOnly();

    protected Investimento() { }

    public Investimento(string nome, string instituicao, TipoInvestimento tipo, decimal valorAplicado, DateTime dataInicio, Guid usuarioId, TipoRentabilidade tipoRentabilidade, Liquidez liquidez, DateTime? dataVencimento = null, decimal? taxaRendimento = null)
    {
        if (string.IsNullOrWhiteSpace(nome)) throw new ArgumentException("Nome é obrigatório.", nameof(nome));
        if (string.IsNullOrWhiteSpace(instituicao)) throw new ArgumentException("Instituição é obrigatória.", nameof(instituicao));
        if (valorAplicado <= 0) throw new ArgumentException("O valor inicial deve ser maior que zero.", nameof(valorAplicado));
        if (dataInicio == default) throw new ArgumentException("A data de início é inválida.", nameof(dataInicio));

        Id = Guid.NewGuid();
        UsuarioId = usuarioId;
        Nome = nome;
        Instituicao = instituicao;
        Tipo = tipo;
        ValorAplicado = valorAplicado;
        SaldoAtual = valorAplicado;
        ValorRetirado = 0;
        DataInicio = dataInicio;
        DataVencimento = dataVencimento;
        TipoRentabilidade = tipoRentabilidade;
        TaxaRendimento = taxaRendimento;
        Liquidez = liquidez;
        Ativo = true;

        _transacoes.Add(new TransacaoInvestimento(Id, TipoOperacaoInvestimento.Aporte, valorAplicado, dataInicio));
    }

    public void AdicionarAporte(decimal valor, DateTime data)
    {
        if (valor <= 0) throw new ArgumentException("O aporte deve ser maior que zero.");
        if (!Ativo) throw new InvalidOperationException("Não é possível aportar em um investimento inativo/encerrado.");

        ValorAplicado += valor;
        SaldoAtual += valor;

        _transacoes.Add(new TransacaoInvestimento(Id, TipoOperacaoInvestimento.Aporte, valor, data));
    }

    public void RegistrarSaque(decimal valor, DateTime data)
    {
        if (valor <= 0) throw new ArgumentException("O saque deve ser maior que zero.");
        if (valor > SaldoAtual) throw new InvalidOperationException("Saldo insuficiente para realizar este saque.");

        ValorRetirado += valor;
        SaldoAtual -= valor;

        _transacoes.Add(new TransacaoInvestimento(Id, TipoOperacaoInvestimento.Saque, valor, data));

        if (SaldoAtual == 0)
        {
            Ativo = false;
        }
    }

    public void AtualizarSaldo(decimal novoSaldoAtual, DateTime dataAtualizacao)
    {
        if (novoSaldoAtual < 0) throw new ArgumentException("O saldo não pode ser negativo.");
        if (!Ativo) throw new InvalidOperationException("Não é possível atualizar o saldo de um investimento inativo.");

        decimal diferencaRendimento = novoSaldoAtual - SaldoAtual;

        if (diferencaRendimento > 0)
        {
            _transacoes.Add(new TransacaoInvestimento(Id, TipoOperacaoInvestimento.Rendimento, diferencaRendimento, dataAtualizacao));
        }

        SaldoAtual = novoSaldoAtual;
    }
}