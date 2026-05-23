using System.ComponentModel.DataAnnotations;

namespace Finance.Core.Application.DTOs;

public record LoginDTO(
	[property: Required]
	[property: EmailAddress]
	[property: MaxLength(200)]
	string Email,

	[property: Required]
	[property: MinLength(8)]
	[property: MaxLength(100)]
	string Senha
);