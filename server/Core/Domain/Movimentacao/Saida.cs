namespace Finance.Core.Domain;

public class Saida : Movimentacao
{
    public Saida(string titulo, string descricao, decimal valor, DateTime data, Guid usuarioId, bool fixa = false, int periodo = 0, TipoRecorrencia tipoRecorrencia = TipoRecorrencia.Mensal, Guid? grupoRecorrenciaId = null, Guid? investimentoId = null, Guid? cartaoId = null, Guid? categoriaId = null, Guid? veiculoId = null, int? km = null, TipoMovimentacaoFixa tipoMovimentacaoFixa = TipoMovimentacaoFixa.RecorrenteFixa)
        : base(titulo, descricao, valor, data, usuarioId, tipoRecorrencia, fixa, periodo, grupoRecorrenciaId, investimentoId, cartaoId, categoriaId, veiculoId, km, tipoMovimentacaoFixa) { Tipo = TipoMovimentacao.Saida; }

    public override Movimentacao ClonarComNovaData(DateTime novaData, Guid grupoRecorrenciaId, string? novoTitulo = null)
    {
        return new Saida(novoTitulo ?? this.Titulo, this.Descricao ?? string.Empty, this.Valor, novaData, this.UsuarioId, this.Fixa, this.Periodo, this.TipoRecorrencia, grupoRecorrenciaId, this.InvestimentoId, this.CartaoId, this.CategoriaId, this.VeiculoId, this.Km, this.TipoMovimentacaoFixa);
    }
}