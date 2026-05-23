namespace Finance.Core.Domain;

public class Saida : Movimentacao
{
    public Saida(string titulo, string descricao, decimal valor, DateTime data, Guid usuarioId, bool fixa = false, int periodo = 0, TipoRecorrencia tipoRecorrencia = TipoRecorrencia.Mensal, Guid? grupoRecorrenciaId = null, Guid? investimentoId = null, Guid? categoriaId = null, Guid? veiculoId = null, int? km = null)
        : base(titulo, descricao, valor, data, usuarioId, tipoRecorrencia, fixa, periodo, grupoRecorrenciaId, investimentoId, categoriaId, veiculoId, km) { Tipo = TipoMovimentacao.Saida; }

    public override Movimentacao ClonarComNovaData(DateTime novaData, Guid grupoRecorrenciaId)
    {
        return new Saida(this.Titulo, this.Descricao, this.Valor, novaData, this.UsuarioId, this.Fixa, this.Periodo, this.TipoRecorrencia, grupoRecorrenciaId, this.InvestimentoId, this.CategoriaId, this.VeiculoId, this.Km);
    }
}