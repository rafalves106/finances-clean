using Finance.Core.Domain;

namespace Finance.Core.Repositories;

public interface IFaturaAgregadaRepository
{
  void Adicionar(FaturaAgregada faturaAgregada);
  void Atualizar(FaturaAgregada faturaAgregada);
  FaturaAgregada? ObterPorCartaoECiclo(Guid usuarioId, Guid cartaoId, int ciclo);
  IReadOnlyCollection<FaturaAgregada> ListarPorCartao(Guid usuarioId, Guid cartaoId);
}