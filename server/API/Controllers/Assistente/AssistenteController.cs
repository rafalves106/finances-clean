using Finance.Core.UseCases;
using Microsoft.AspNetCore.Mvc;

namespace Finance.API.Controllers;

public record InterpretarMovimentacaoRequest(string Texto);

[ApiController]
[Route("api/v1/assistente")]
public class AssistenteController(
    InterpretarMovimentacaoTextoUseCase interpretarMovimentacaoTextoUseCase) : AuthenticatedController
{
  [HttpPost("interpretar-movimentacao")]
  public async Task<IActionResult> InterpretarMovimentacao([FromBody] InterpretarMovimentacaoRequest request)
  {
    try
    {
      var resultado = await interpretarMovimentacaoTextoUseCase.Executar(UsuarioId, request.Texto);
      return Ok(resultado);
    }
    catch (ArgumentException ex)
    {
      return BadRequest(ex.Message);
    }
  }
}
