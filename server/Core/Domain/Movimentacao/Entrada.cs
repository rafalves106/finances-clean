namespace Finance.Core.Domain;

public class Entrada : Movimentacao
{
    public Entrada(string titulo, string? descricao, decimal valor, DateTime data, Guid usuarioId,
        bool fixa = false, int periodo = 0, TipoRecorrencia tipoRecorrencia = TipoRecorrencia.Mensal, Guid? grupoRecorrenciaId = null,
         Guid? investimentoId = null, Guid? cartaoId = null, int? competenciaFatura = null, Guid? categoriaId = null, Guid? veiculoId = null, int? km = null, TipoMovimentacaoFixa tipoMovimentacaoFixa = TipoMovimentacaoFixa.RecorrenteFixa, bool ehMovimentacaoFatura = false, Guid? faturaAgregadaId = null)
        : base(titulo, descricao, valor, data, usuarioId, tipoRecorrencia, fixa, periodo,
             grupoRecorrenciaId, investimentoId, cartaoId, competenciaFatura, categoriaId, veiculoId, km, tipoMovimentacaoFixa, ehMovimentacaoFatura, faturaAgregadaId)
    { Tipo = TipoMovimentacao.Entrada; }

    public override Movimentacao ClonarComNovaData(DateTime novaData, Guid grupoRecorrenciaId, string? novoTitulo = null)
    {
        return new Entrada(novoTitulo ?? this.Titulo, this.Descricao, this.Valor, novaData, this.UsuarioId,
            this.Fixa, this.Periodo, this.TipoRecorrencia, grupoRecorrenciaId, this.InvestimentoId, this.CartaoId, this.CompetenciaFatura, this.CategoriaId, this.VeiculoId, this.Km, this.TipoMovimentacaoFixa, this.EhMovimentacaoFatura, this.FaturaAgregadaId);
    }
}