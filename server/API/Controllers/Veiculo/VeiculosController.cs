using Microsoft.AspNetCore.Mvc;
using Finance.Core.Application.DTOs;
using Finance.Core.UseCases;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/v1/veiculos")]
public class VeiculosController(
    CriarVeiculoUseCase criarVeiculoUseCase,
    ListarVeiculosUseCase listarVeiculosUseCase,
    BuscarVeiculoPorIdUseCase buscarVeiculoPorIdUseCase,
    AtualizarVeiculoUseCase atualizarVeiculoUseCase,
    RemoverVeiculoUseCase removerVeiculoUseCase,
    AtualizarUltimoKmAlertaUseCase atualizarUltimoKmAlertaUseCase) : AuthenticatedController
{
  [HttpPost]
  public IActionResult Criar([FromBody] VeiculoDTO dto)
  {
    try
    {
      var id = criarVeiculoUseCase.Executar(UsuarioId, dto);
      return CreatedAtAction(nameof(BuscarPorId), new { id }, new { Id = id });
    }
    catch (ArgumentException ex) { return BadRequest(ex.Message); }
  }

  [HttpGet]
  public IActionResult Listar()
  {
    try
    {
      var veiculos = listarVeiculosUseCase.Executar();
      return Ok(veiculos);
    }
    catch (Exception ex) { return StatusCode(500, ex.Message); }
  }

  [HttpGet("{id}")]
  public IActionResult BuscarPorId(Guid id)
  {
    try
    {
      var veiculo = buscarVeiculoPorIdUseCase.Executar(id);
      if (veiculo is null)
        return NotFound();

      return Ok(veiculo);
    }
    catch (Exception ex) { return StatusCode(500, ex.Message); }
  }

  [HttpPut("{id}")]
  public IActionResult Atualizar(Guid id, [FromBody] VeiculoDTO dto)
  {
    try
    {
      atualizarVeiculoUseCase.Executar(id, dto);
      return NoContent();
    }
    catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    catch (ArgumentException ex) { return BadRequest(ex.Message); }
  }

  [HttpDelete("{id}")]
  public IActionResult Remover(Guid id)
  {
    try
    {
      removerVeiculoUseCase.Executar(id);
      return NoContent();
    }
    catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
  }

  [HttpPatch("{id}/alerta-km")]
  public IActionResult AtualizarAlertaKm(Guid id, [FromBody] AtualizarAlertaKmRequest request)
  {
    try
    {
      atualizarUltimoKmAlertaUseCase.Executar(id, request.Km);
      return NoContent();
    }
    catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    catch (ArgumentException ex) { return BadRequest(ex.Message); }
  }
}

public record AtualizarAlertaKmRequest(int Km);
