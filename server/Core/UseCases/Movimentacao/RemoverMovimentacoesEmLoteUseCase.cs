using Finance.Core.Application.DTOs;
using Finance.Core.Domain;
using Finance.Core.Repositories;

namespace Finance.Core.UseCases;

public class RemoverMovimentacoesEmLoteUseCase(IMovimentacaoRepository movimentacaoRepository)
{
  public RemocaoEmLoteResultado Executar(IReadOnlyList<Guid> ids)
  {
    if (ids.Count == 0)
    {
      throw new ArgumentException("Informe ao menos um id para remover.");
    }

    var idsUnicos = ids.Distinct().ToList();
    var idsNaoEncontrados = new List<Guid>();
    var idsBloqueados = new List<Guid>();
    var paraRemover = new List<Movimentacao>();

    foreach (var id in idsUnicos)
    {
      var movimentacao = movimentacaoRepository.ObterPorId(id);

      if (movimentacao is null)
      {
        idsNaoEncontrados.Add(id);
        continue;
      }

      if (movimentacao.InvestimentoId.HasValue)
      {
        idsBloqueados.Add(id);
        continue;
      }

      paraRemover.Add(movimentacao);
    }

    if (paraRemover.Count > 0)
    {
      movimentacaoRepository.RemoverEmLote(paraRemover);
    }

    return new RemocaoEmLoteResultado(idsUnicos.Count, paraRemover.Count, idsNaoEncontrados, idsBloqueados);
  }
}
