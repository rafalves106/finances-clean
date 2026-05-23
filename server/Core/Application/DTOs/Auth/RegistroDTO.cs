using System.ComponentModel.DataAnnotations;

namespace Finance.Core.Application.DTOs;

public record RegistroDTO(
	[Required]
	[MinLength(2)]
	[MaxLength(100)]
	string Nome,

	[Required]
	[EmailAddress]
	[MaxLength(200)]
	string Email,

	[Required]
	[MinLength(8)]
	[MaxLength(100)]
	string Senha
);