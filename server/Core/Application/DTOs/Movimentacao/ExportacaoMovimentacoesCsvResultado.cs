namespace Finance.Core.Application.DTOs;

public record ExportacaoMovimentacoesCsvResultado(byte[] Conteudo, string NomeArquivo);