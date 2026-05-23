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
    catch (ArgumentException) { return BadRequest("Dados de veículo inválidos."); }
  }

  [HttpGet]
  public IActionResult Listar()
  {
    try
    {
      var veiculos = listarVeiculosUseCase.Executar();
      return Ok(veiculos);
    }
    catch (Exception) { return StatusCode(500, "Erro ao listar veículos."); }
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
    catch (Exception) { return StatusCode(500, "Erro ao buscar veículo."); }
  }

  [HttpPut("{id}")]
  public IActionResult Atualizar(Guid id, [FromBody] VeiculoDTO dto)
  {
    try
    {
      atualizarVeiculoUseCase.Executar(id, dto);
      return NoContent();
    }
    catch (KeyNotFoundException) { return NotFound("Veículo não encontrado."); }
    catch (ArgumentException) { return BadRequest("Dados de veículo inválidos."); }
  }

  [HttpDelete("{id}")]
  public IActionResult Remover(Guid id)
  {
    try
    {
      removerVeiculoUseCase.Executar(id);
      return NoContent();
    }
    catch (KeyNotFoundException) { return NotFound("Veículo não encontrado."); }
  }

  [HttpPatch("{id}/alerta-km")]
  public IActionResult AtualizarAlertaKm(Guid id, [FromBody] AtualizarAlertaKmRequest request)
  {
    try
    {
      atualizarUltimoKmAlertaUseCase.Executar(id, request.Km);
      return NoContent();
    }
    catch (KeyNotFoundException) { return NotFound("Veículo não encontrado."); }
    catch (ArgumentException) { return BadRequest("Dados de alerta de km inválidos."); }
  }
}

public record AtualizarAlertaKmRequest(int Km);
