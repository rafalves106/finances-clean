using Microsoft.AspNetCore.Mvc;
using Finance.Core.UseCases;
using Finance.Core.Application.DTOs;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/v1/metas")]
public class MetasController(
CriarMetaUseCase criarMetaUseCase,
ListarMetasUseCase listarMetasUseCase,
AtualizarMetaUseCase atualizarMetaUseCase,
RemoverMetaUseCase removerMetaUseCase,
AlternarConclusaoMetaUseCase alternarConclusaoMetaUseCase) : AuthenticatedController
{
  [HttpPost]
  public IActionResult Criar([FromBody] MetaDTO dto)
  {
    try
    {
      var id = criarMetaUseCase.Executar(UsuarioId, dto);
      return CreatedAtAction(nameof(Listar), new { id }, new { Id = id });
    }
    catch (ArgumentException ex) { return BadRequest(ex.Message); }
  }

  [HttpGet]
  public IActionResult Listar()
  {
    var metas = listarMetasUseCase.Executar();
    return Ok(metas);
  }

  [HttpPut("{id}")]
  public IActionResult Atualizar(Guid id, [FromBody] MetaDTO dto)
  {
    try
    {
      atualizarMetaUseCase.Executar(id, dto);
      return NoContent();
    }
    catch (ArgumentException ex) { return BadRequest(ex.Message); }
  }

  [HttpPatch("{id}/conclusao")]
  public IActionResult AlternarConclusao(Guid id)
  {
    try
    {
      alternarConclusaoMetaUseCase.Executar(id);
      return NoContent();
    }
    catch (ArgumentException ex) { return BadRequest(ex.Message); }
  }

  [HttpDelete("{id}")]
  public IActionResult Remover(Guid id)
  {
    try
    {
      removerMetaUseCase.Executar(id);
      return NoContent();
    }
    catch (ArgumentException ex) { return BadRequest(ex.Message); }
  }
}