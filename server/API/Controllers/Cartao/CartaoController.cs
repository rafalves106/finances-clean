using Finance.Core.Application.DTOs;
using Finance.Core.UseCases;
using Microsoft.AspNetCore.Mvc;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/v1/cartao")]
public class CartaoController(
    CadastrarCartaoManualUseCase cadastrarCartaoManualUseCase,
    EditarCartaoManualUseCase editarCartaoManualUseCase,
    InativarCartaoManualUseCase inativarCartaoManualUseCase,
    ObterResumoCartaoUseCase obterResumoCartaoUseCase,
    ObterPrevisaoFaturaUseCase obterPrevisaoFaturaUseCase) : AuthenticatedController
{
  [HttpPost]
  public IActionResult Cadastrar([FromBody] CadastrarCartaoManualDTO dto)
  {
    if (TemDadoSensivel(dto.NumeroCartao, dto.Cvv, dto.Token))
    {
      return BadRequest(Erro("CARTAO_DADO_SENSIVEL_PROIBIDO", "Campos sensíveis de cartão não são permitidos."));
    }

    try
    {
      var cartao = cadastrarCartaoManualUseCase.Executar(
          UsuarioId,
          dto.Nome,
          dto.LimiteTotal,
          dto.DiaFechamento,
          dto.DiaVencimento);

      return CreatedAtAction(nameof(ObterResumo), new { id = cartao.Id }, cartao);
    }
    catch (InvalidOperationException)
    {
      return Conflict(Erro("CARTAO_ATIVO_JA_EXISTE", "Já existe um cartão ativo para o usuário."));
    }
    catch (ArgumentException ex)
    {
      return BadRequest(MapearErroValidacao(ex));
    }
  }

  [HttpPut("{cartaoId:guid}")]
  public IActionResult Editar(Guid cartaoId, [FromBody] EditarCartaoManualDTO dto)
  {
    if (TemDadoSensivel(dto.NumeroCartao, dto.Cvv, dto.Token))
    {
      return BadRequest(Erro("CARTAO_DADO_SENSIVEL_PROIBIDO", "Campos sensíveis de cartão não são permitidos."));
    }

    try
    {
      editarCartaoManualUseCase.Executar(
          UsuarioId,
          cartaoId,
          dto.Nome,
          dto.LimiteTotal,
          dto.DiaFechamento,
          dto.DiaVencimento);

      return NoContent();
    }
    catch (KeyNotFoundException)
    {
      return NotFound(Erro("CARTAO_NAO_ENCONTRADO", "Cartão não encontrado."));
    }
    catch (ArgumentException ex)
    {
      return BadRequest(MapearErroValidacao(ex));
    }
  }

  [HttpDelete("{cartaoId:guid}")]
  public IActionResult Inativar(Guid cartaoId)
  {
    try
    {
      inativarCartaoManualUseCase.Executar(UsuarioId, cartaoId);
      return NoContent();
    }
    catch (KeyNotFoundException)
    {
      return NotFound(Erro("CARTAO_NAO_ENCONTRADO", "Cartão não encontrado."));
    }
  }

  [HttpGet("resumo")]
  public IActionResult ObterResumo()
  {
    var resumo = obterResumoCartaoUseCase.Executar(UsuarioId);
    return resumo is null ? NotFound(Erro("CARTAO_NAO_ENCONTRADO", "Cartão não encontrado.")) : Ok(resumo);
  }

  [HttpGet("previsao")]
  public IActionResult ObterPrevisao()
  {
    var previsao = obterPrevisaoFaturaUseCase.Executar(UsuarioId);
    return previsao is null ? NotFound(Erro("CARTAO_NAO_ENCONTRADO", "Cartão não encontrado.")) : Ok(previsao);
  }

  private static bool TemDadoSensivel(params string?[] values)
      => values.Any(v => !string.IsNullOrWhiteSpace(v));

  private static object MapearErroValidacao(ArgumentException ex)
  {
    if (ex.Message.Contains("Limite total", StringComparison.OrdinalIgnoreCase))
    {
      return Erro("CARTAO_LIMITE_INVALIDO", ex.Message);
    }

    if (ex.Message.Contains("fechamento", StringComparison.OrdinalIgnoreCase) &&
        !ex.Message.Contains("menor", StringComparison.OrdinalIgnoreCase))
    {
      return Erro("CARTAO_FECHAMENTO_INVALIDO", ex.Message);
    }

    if (ex.Message.Contains("vencimento", StringComparison.OrdinalIgnoreCase) &&
        !ex.Message.Contains("menor", StringComparison.OrdinalIgnoreCase))
    {
      return Erro("CARTAO_VENCIMENTO_INVALIDO", ex.Message);
    }

    if (ex.Message.Contains("fechamento deve ser menor", StringComparison.OrdinalIgnoreCase))
    {
      return Erro("CARTAO_CICLO_INCONSISTENTE", ex.Message);
    }

    return Erro("CARTAO_DADOS_INVALIDOS", ex.Message);
  }

  private static object Erro(string code, string message)
      => new { error = new { code, message } };
}
