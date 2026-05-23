using Microsoft.AspNetCore.Mvc;
using Finance.Core.Application.DTOs;
using Finance.Core.UseCases;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/v1/categorias")]
public class CategoriasController(
CriarCategoriaUseCase criarCategoriaUseCase,
ListarCategoriasUseCase listarCategoriasUseCase,
AtualizarCategoriaUseCase atualizarCategoriaUseCase,
RemoverCategoriaUseCase removerCategoriaUseCase) : AuthenticatedController
{
  [HttpPost]
  public IActionResult Criar([FromBody] CategoriaDTO dto)
  {
    try
    {
      var id = criarCategoriaUseCase.Executar(UsuarioId, dto);
      return CreatedAtAction(nameof(Listar), new { id }, new { Id = id });
    }
    catch (ArgumentException) { return BadRequest("Dados de categoria inválidos."); }
  }

  [HttpGet]
  public IActionResult Listar()
  {
    var categorias = listarCategoriasUseCase.Executar();
    return Ok(categorias);
  }

  [HttpPut("{id}")]
  public IActionResult Atualizar(Guid id, [FromBody] CategoriaDTO dto)
  {
    try
    {
      atualizarCategoriaUseCase.Executar(id, dto);
      return NoContent();
    }
    catch (ArgumentException) { return BadRequest("Dados de categoria inválidos."); }
  }

  [HttpDelete("{id}")]
  public IActionResult Remover(Guid id)
  {
    try
    {
      removerCategoriaUseCase.Executar(id);
      return NoContent();
    }
    catch (ArgumentException) { return BadRequest("Operação de categoria inválida."); }
  }
}