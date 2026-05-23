using System.ComponentModel.DataAnnotations;

namespace Finance.Core.Application.DTOs;

public record RegistroDTO(
	[property: Required]
	[property: MinLength(2)]
	[property: MaxLength(100)]
	string Nome,

	[property: Required]
	[property: EmailAddress]
	[property: MaxLength(200)]
	string Email,

	[property: Required]
	[property: MinLength(8)]
	[property: MaxLength(100)]
	string Senha
);