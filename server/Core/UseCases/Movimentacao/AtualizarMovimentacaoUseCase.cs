using Finance.Core.Repositories;
using Finance.Core.Application.DTOs;

namespace Finance.Core.UseCases;

public class AtualizarMovimentacaoUseCase(IMovimentacaoRepository _movimentacaoRepository)
{
    public void Executar(Guid id, MovimentacaoDTO dto)
    {
        var movimentacaoExistente = _movimentacaoRepository.ObterPorId(id) ?? throw new ArgumentException($"Movimentação {id} não encontrada.");

        if (movimentacaoExistente == null)
        {
            throw new Exception("Movimentação não encontrada.");
        }

        movimentacaoExistente.AtualizarDados(dto.Titulo, dto.Descricao, dto.Valor, dto.Data, dto.Fixa, dto.Periodo, dto.CategoriaId, dto.VeiculoId, dto.Km, dto.CartaoId, dto.TipoMovimentacaoFixa);

        _movimentacaoRepository.Atualizar(movimentacaoExistente);
    }
}