using System.ComponentModel.DataAnnotations;

namespace Finance.Core.Application.DTOs;

public record LoginDTO(
	[Required]
	[EmailAddress]
	[MaxLength(200)]
	string Email,

	[Required]
	[MinLength(8)]
	[MaxLength(100)]
	string Senha
);