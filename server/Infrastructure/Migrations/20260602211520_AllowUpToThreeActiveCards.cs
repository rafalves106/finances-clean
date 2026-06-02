using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AllowUpToThreeActiveCards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartoesManuais_UsuarioId_Ativo",
                table: "CartoesManuais");

            migrationBuilder.CreateIndex(
                name: "IX_CartoesManuais_UsuarioId_Ativo",
                table: "CartoesManuais",
                columns: new[] { "UsuarioId", "Ativo" },
                filter: "\"Ativo\" = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartoesManuais_UsuarioId_Ativo",
                table: "CartoesManuais");

            migrationBuilder.CreateIndex(
                name: "IX_CartoesManuais_UsuarioId_Ativo",
                table: "CartoesManuais",
                columns: new[] { "UsuarioId", "Ativo" },
                unique: true,
                filter: "\"Ativo\" = true");
        }
    }
}
