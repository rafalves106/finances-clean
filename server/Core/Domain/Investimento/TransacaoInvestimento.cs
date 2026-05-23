namespace Finance.Core.Domain;

public class TransacaoInvestimento
{
    public Guid Id { get; private set; }
    public Guid InvestimentoId { get; private set; }

    public Investimento Investimento { get; private set; } = null!;

    public TipoOperacaoInvestimento Tipo { get; private set; }
    public decimal Valor { get; private set; }
    public DateTime Data { get; private set; }

    protected TransacaoInvestimento() { }

    public TransacaoInvestimento(Guid investimentoId, TipoOperacaoInvestimento tipo, decimal valor, DateTime data)
    {
        if (valor <= 0) throw new ArgumentException("O valor da transação deve ser maior que zero.", nameof(valor));
        if (data == default) throw new ArgumentException("A data da transação é inválida.", nameof(data));

        Id = Guid.NewGuid();
        InvestimentoId = investimentoId;
        Tipo = tipo;
        Valor = valor;
        Data = data;
    }
}