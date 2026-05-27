using Microsoft.AspNetCore.Mvc;
using Finance.Core.UseCases;
using Finance.Core.Domain;
using Finance.Core.Application.DTOs;
using Finance.Core.Repositories;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/v1/movimentacoes")]
public class MovimentacoesController(CriarMovimentacaoUseCase criarMovimentacaoUseCase, AtualizarMovimentacaoUseCase atualizarMovimentacaoUseCase, ListarMovimentacoesUseCase listarMovimentacoesUseCase, BuscarMovimentacaoUseCase buscarMovimentacaoUseCase, BuscarEntradaUseCase buscarEntradaUseCase, BuscarSaidaUseCase buscarSaidaUseCase, RemoverMovimentacaoUseCase removerMovimentacaoUseCase, BuscarMovimentacoesPorPeriodoUseCase buscarMovimentacoesPorPeriodoUseCase, BuscarEntradasPorPeriodoUseCase buscarEntradasPorPeriodoUseCase, BuscarSaidasPorPeriodoUseCase buscarSaidasPorPeriodoUseCase, ObterResumoMensalUseCase obterResumoMensalUseCase, ObterComparativoCategoriaMensalUseCase obterComparativoCategoriaMensalUseCase, RenumerarGrupoUseCase renumerarGrupoUseCase, ExportarMovimentacoesCsvUseCase exportarMovimentacoesCsvUseCase, IMovimentacaoRepository movimentacaoRepository) : AuthenticatedController
{
    [HttpPost]
    public IActionResult CriarMovimentacao([FromBody] MovimentacaoDTO movimentacaoDTO)
    {
        try
        {
            Movimentacao movimentacao = movimentacaoDTO.Tipo switch
            {
                TipoMovimentacao.Entrada => new Entrada(
                    movimentacaoDTO.Titulo,
                    movimentacaoDTO.Descricao,
                    movimentacaoDTO.Valor,
                    movimentacaoDTO.Data,
                    UsuarioId,
                    movimentacaoDTO.Fixa,
                    movimentacaoDTO.Periodo,
                    movimentacaoDTO.TipoRecorrencia,
                    categoriaId: movimentacaoDTO.CategoriaId,
                    veiculoId: movimentacaoDTO.VeiculoId,
                    km: movimentacaoDTO.Km,
                    tipoMovimentacaoFixa: movimentacaoDTO.TipoMovimentacaoFixa
                ),
                TipoMovimentacao.Saida => new Saida(
                    movimentacaoDTO.Titulo,
                    movimentacaoDTO.Descricao ?? string.Empty,
                    movimentacaoDTO.Valor,
                    movimentacaoDTO.Data,
                    UsuarioId,
                    movimentacaoDTO.Fixa,
                    movimentacaoDTO.Periodo,
                    movimentacaoDTO.TipoRecorrencia,
                    categoriaId: movimentacaoDTO.CategoriaId,
                    veiculoId: movimentacaoDTO.VeiculoId,
                    km: movimentacaoDTO.Km,
                    tipoMovimentacaoFixa: movimentacaoDTO.TipoMovimentacaoFixa
                ),
                _ => throw new ArgumentException("Tipo de movimentação inválido.")
            };

            criarMovimentacaoUseCase.Executar(movimentacao);

            return CreatedAtAction(nameof(CriarMovimentacao), new { id = movimentacao.Id }, movimentacao);
        }
        catch (ArgumentException)
        {
            return BadRequest("Dados de movimentação inválidos.");
        }
    }

    [HttpGet]
    public IActionResult ListarMovimentacoes([FromQuery] int? mes = null, [FromQuery] int? ano = null)
    {
        try
        {
            var movimentacoes = listarMovimentacoesUseCase.Executar(mes, ano);
            return Ok(movimentacoes);
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao listar movimentações.");
        }
    }

    [HttpGet("resumo")]
    public IActionResult ObterResumoMensal([FromQuery] int mes, [FromQuery] int ano)
    {
        try
        {
            return Ok(obterResumoMensalUseCase.Executar(mes, ano));
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao obter resumo mensal.");
        }
    }

    [HttpGet("comparativo-categorias")]
    public IActionResult ObterComparativoCategoriasMensal([FromQuery] int mes, [FromQuery] int ano, [FromQuery] int meses = 3)
    {
        try
        {
            return Ok(obterComparativoCategoriaMensalUseCase.Executar(UsuarioId, mes, ano, meses));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao obter comparativo de categorias.");
        }
    }

    [HttpGet("{id}")]
    public IActionResult BuscarMovimentacao(Guid id)
    {
        try
        {
            var movimentacao = buscarMovimentacaoUseCase.Executar(id);
            if (movimentacao == null)
            {
                return NotFound($"Nenhuma movimentação encontrada com o ID: {id}");
            }
            return Ok(movimentacao);
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao buscar movimentação.");
        }
    }

    [HttpGet("entradas")]
    public IActionResult BuscarEntradas()
    {
        try
        {
            return Ok(buscarEntradaUseCase.Executar());
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao buscar entradas.");
        }
    }


    [HttpGet("saidas")]
    public IActionResult BuscarSaidas()
    {
        try
        {
            return Ok(buscarSaidaUseCase.Executar());
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao buscar saídas.");
        }
    }

    [HttpGet("periodo")]
    public IActionResult BuscarMovimentacoesPorPeriodo(
[FromQuery] DateTime dataInicio,
[FromQuery] DateTime dataFim,
[FromQuery] TipoMovimentacao? tipo = null)
    {
        try
        {
            var movimentacoes = tipo switch
            {
                TipoMovimentacao.Entrada => buscarEntradasPorPeriodoUseCase.Executar(dataInicio, dataFim),
                TipoMovimentacao.Saida => buscarSaidasPorPeriodoUseCase.Executar(dataInicio, dataFim),
                _ => buscarMovimentacoesPorPeriodoUseCase.Executar(dataInicio, dataFim)
            };

            return Ok(movimentacoes);
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao buscar movimentações.");
        }
    }

    [HttpPut("{id}")]
    public IActionResult AtualizarMovimentacao(Guid id, [FromBody] MovimentacaoDTO movimentacaoDTO)
    {
        try
        {
            atualizarMovimentacaoUseCase.Executar(id, movimentacaoDTO);
            return NoContent();
        }
        catch (ArgumentException)
        {
            return BadRequest("Dados de movimentação inválidos.");
        }
    }


    [HttpDelete("{id}")]
    public IActionResult RemoverMovimentacao(Guid id)
    {
        try
        {
            removerMovimentacaoUseCase.Executar(id);
            return NoContent();
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao remover movimentação.");
        }
    }

    [HttpGet("saldo-acumulado")]
    public IActionResult ObterSaldoAcumulado(
    [FromQuery] int mes,
    [FromQuery] int ano)
    {
        try
        {
            var saldo = movimentacaoRepository.ObterSaldoAcumulado(mes, ano);
            return Ok(new { saldo });
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao calcular saldo acumulado.");
        }
    }

    [HttpPost("grupos/{grupoRecorrenciaId:guid}/renumerar")]
    public IActionResult RenumerarGrupoRecorrencia(Guid grupoRecorrenciaId)
    {
        try
        {
            var resultado = renumerarGrupoUseCase.Executar(grupoRecorrenciaId, UsuarioId);
            return Ok(resultado);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Grupo de recorrência não encontrado.");
        }
        catch (ArgumentException)
        {
            return BadRequest("Dados inválidos para renumeração.");
        }
    }

    [HttpGet("exportar-csv")]
    public IActionResult ExportarCsv([FromQuery] DateTime dataInicio, [FromQuery] DateTime dataFim)
    {
        try
        {
            var resultado = exportarMovimentacoesCsvUseCase.Executar(UsuarioId, dataInicio, dataFim);
            return File(resultado.Conteudo, "text/csv; charset=utf-8", resultado.NomeArquivo);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "Erro ao exportar movimentações em CSV.");
        }
    }
}

