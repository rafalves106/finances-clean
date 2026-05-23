using Microsoft.AspNetCore.Mvc;
using Finance.Core.UseCases;
using Finance.Core.Application.DTOs;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/v1/investimentos")]
public class InvestimentosController(
    CriarInvestimentoUseCase criarInvestimentoUseCase,
    ListarInvestimentosUseCase listarInvestimentosUseCase,
    ObterInvestimentoPorIdUseCase obterInvestimentoPorIdUseCase,
    RealizarAporteUseCase realizarAporteUseCase,
    RealizarSaqueUseCase realizarSaqueUseCase,
    AtualizarSaldoInvestimentoUseCase atualizarSaldoInvestimentoUseCase,
    RemoverInvestimentoUseCase removerInvestimentoUseCase) : AuthenticatedController
{
    [HttpPost]
    public IActionResult CriarInvestimento([FromBody] CriarInvestimentoDTO dto)
    {
        try
        {
            var id = criarInvestimentoUseCase.Executar(UsuarioId, dto);
            return CreatedAtAction(nameof(BuscarInvestimento), new { id = id }, new { Id = id });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public IActionResult ListarInvestimentos([FromQuery] bool mostrarInativos = false)
    {
        try
        {
            var investimentos = listarInvestimentosUseCase.Executar(mostrarInativos);
            return Ok(investimentos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erro ao listar investimentos: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public IActionResult BuscarInvestimento(Guid id)
    {
        try
        {
            var investimento = obterInvestimentoPorIdUseCase.Executar(id);
            if (investimento == null) return NotFound("Investimento não encontrado.");

            return Ok(investimento);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erro ao buscar investimento: {ex.Message}");
        }
    }

    [HttpPost("{id}/aportes")]
    public IActionResult RealizarAporte(Guid id, [FromBody] OperacaoInvestimentoDTO dto)
    {
        try
        {
            realizarAporteUseCase.Executar(UsuarioId, id, dto);
            return NoContent();
        }
        catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/saques")]
    public IActionResult RealizarSaque(Guid id, [FromBody] OperacaoInvestimentoDTO dto)
    {
        try
        {
            realizarSaqueUseCase.Executar(UsuarioId, id, dto);
            return NoContent();
        }
        catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}/saldo")]
    public IActionResult AtualizarSaldo(Guid id, [FromBody] AtualizarSaldoDTO dto)
    {
        try
        {
            atualizarSaldoInvestimentoUseCase.Executar(id, dto.NovoSaldoAtual, dto.DataAtualizacao);
            return NoContent();
        }
        catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public IActionResult RemoverInvestimento(Guid id)
    {
        try
        {
            removerInvestimentoUseCase.Executar(UsuarioId, id);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}