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
  ListarCartoesManuaisUseCase listarCartoesManuaisUseCase,
  ListarResumosCartoesUseCase listarResumosCartoesUseCase,
    ObterResumoCartaoUseCase obterResumoCartaoUseCase,
  ObterPrevisaoFaturaUseCase obterPrevisaoFaturaUseCase,
  ExecutarPreviewBackfillCompetenciaCartaoUseCase executarPreviewBackfillCompetenciaCartaoUseCase,
  ExecutarApplyBackfillCompetenciaCartaoUseCase executarApplyBackfillCompetenciaCartaoUseCase,
  ExecutarRollbackBackfillCompetenciaCartaoUseCase executarRollbackBackfillCompetenciaCartaoUseCase) : AuthenticatedController
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
          dto.DiaVencimento,
          dto.CorTema);

      return CreatedAtAction(nameof(ObterResumo), new { id = cartao.Id }, cartao);
    }
    catch (InvalidOperationException ex) when (ex.Message == "CARTAO_LIMITE_ATIVOS_EXCEDIDO")
    {
      return Conflict(Erro("CARTAO_LIMITE_ATIVOS_EXCEDIDO", "Usuário já possui 3 cartões ativos."));
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
          dto.DiaVencimento,
          dto.CorTema);

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

  [HttpGet("resumos")]
  public IActionResult ListarResumos()
  {
    var resumos = listarResumosCartoesUseCase.Executar(UsuarioId);
    return Ok(resumos);
  }

  [HttpGet]
  public IActionResult Listar([FromQuery] bool incluirInativos = true)
  {
    var cartoes = listarCartoesManuaisUseCase.Executar(UsuarioId, incluirInativos);
    return Ok(cartoes);
  }

  [HttpGet("previsao")]
  public IActionResult ObterPrevisao()
  {
    var previsao = obterPrevisaoFaturaUseCase.Executar(UsuarioId);
    return previsao is null ? NotFound(Erro("CARTAO_NAO_ENCONTRADO", "Cartão não encontrado.")) : Ok(previsao);
  }

  [HttpPost("backfill/preview")]
  public IActionResult PreviewBackfill([FromBody] CartaoBackfillPreviewRequestDTO? dto)
  {
    var response = executarPreviewBackfillCompetenciaCartaoUseCase.Executar(UsuarioId, dto?.DataInicio, dto?.DataFim);
    return Ok(response);
  }

  [HttpPost("backfill/apply")]
  public IActionResult ApplyBackfill([FromBody] CartaoBackfillApplyRequestDTO dto)
  {
    if (dto.ExecutionId == Guid.Empty)
    {
      return Conflict(Erro("BACKFILL_PREVIEW_OBRIGATORIO", "Preview é obrigatório antes do apply."));
    }

    try
    {
      var response = executarApplyBackfillCompetenciaCartaoUseCase.Executar(UsuarioId, dto.ExecutionId);
      return Ok(response);
    }
    catch (InvalidOperationException ex) when (ex.Message == "BACKFILL_PREVIEW_OBRIGATORIO")
    {
      return Conflict(Erro("BACKFILL_PREVIEW_OBRIGATORIO", "Preview é obrigatório antes do apply."));
    }
    catch (InvalidOperationException ex) when (ex.Message == "BACKFILL_EXECUTION_INVALIDA")
    {
      return Conflict(Erro("BACKFILL_EXECUTION_INVALIDA", "ExecutionId inválido para apply."));
    }
  }

  [HttpPost("backfill/rollback")]
  public IActionResult RollbackBackfill([FromBody] CartaoBackfillRollbackRequestDTO dto)
  {
    try
    {
      var response = executarRollbackBackfillCompetenciaCartaoUseCase.Executar(UsuarioId, dto.ExecutionId);
      return Ok(response);
    }
    catch (InvalidOperationException ex) when (ex.Message == "BACKFILL_EXECUTION_INVALIDA")
    {
      return Conflict(Erro("BACKFILL_EXECUTION_INVALIDA", "ExecutionId inválido para rollback."));
    }
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

    if (ex.Message.Contains("Cor tema", StringComparison.OrdinalIgnoreCase))
    {
      return Erro("CARTAO_COR_TEMA_INVALIDA", ex.Message);
    }

    return Erro("CARTAO_DADOS_INVALIDOS", ex.Message);
  }

  private static object Erro(string code, string message)
      => new { error = new { code, message } };
}
