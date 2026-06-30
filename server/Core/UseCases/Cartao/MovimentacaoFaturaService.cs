using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class MovimentacaoFaturaService(
  IMovimentacaoRepository movimentacaoRepository,
  IFaturaAgregadaRepository faturaAgregadaRepository,
  ICartaoRepository cartaoRepository)
{
  public Saida CreateOrUpdateForFatura(Guid usuarioId, FaturaAgregada fatura)
  {
    var cartao = cartaoRepository.ObterPorId(fatura.CartaoId, usuarioId)
      ?? throw new KeyNotFoundException("CARTAO_NAO_ENCONTRADO");

    var titulo = $"Fatura {cartao.Nome} {FormatarCiclo(fatura.Ciclo)}";
    var descricao = "Movimentação agregada de fatura de cartão.";

    var existente = fatura.MovimentacaoId.HasValue
      ? movimentacaoRepository.ObterPorId(fatura.MovimentacaoId.Value) as Saida
      : movimentacaoRepository.ObterMovimentacaoFatura(usuarioId, fatura.Id);

    if (existente is null)
    {
      var novaMovimentacao = new Saida(
        titulo,
        descricao,
        fatura.ValorTotal,
        fatura.Vencimento,
        usuarioId,
        cartaoId: fatura.CartaoId,
        competenciaFatura: fatura.Ciclo,
        ehMovimentacaoFatura: true,
        faturaAgregadaId: fatura.Id);

      movimentacaoRepository.Adicionar(novaMovimentacao);
      fatura.VincularMovimentacao(novaMovimentacao.Id);
      faturaAgregadaRepository.Atualizar(fatura);
      return novaMovimentacao;
    }

    existente.AtualizarDados(
      titulo,
      descricao,
      fatura.ValorTotal,
      fatura.Vencimento,
      fixa: false,
      periodo: 0,
      categoriaId: existente.CategoriaId,
      veiculoId: existente.VeiculoId,
      km: existente.Km,
      cartaoId: fatura.CartaoId,
      competenciaFatura: fatura.Ciclo,
      tipoMovimentacaoFixa: TipoMovimentacaoFixa.RecorrenteFixa,
      ehMovimentacaoFatura: true,
      faturaAgregadaId: fatura.Id);

    movimentacaoRepository.Atualizar(existente);

    if (!fatura.MovimentacaoId.HasValue || fatura.MovimentacaoId.Value != existente.Id)
    {
      fatura.VincularMovimentacao(existente.Id);
      faturaAgregadaRepository.Atualizar(fatura);
    }

    return existente;
  }

  private static string FormatarCiclo(int ciclo)
  {
    var ano = ciclo / 100;
    var mes = ciclo % 100;
    return $"{mes:D2}/{ano:D4}";
  }
}
