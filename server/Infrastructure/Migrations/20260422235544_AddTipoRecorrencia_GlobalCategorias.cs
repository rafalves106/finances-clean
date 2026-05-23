using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoRecorrencia_GlobalCategorias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TipoRecorrencia",
                table: "Movimentacoes",
                type: "text",
                nullable: false,
                defaultValue: "Mensal");

            migrationBuilder.AddColumn<bool>(
                name: "IsGlobal",
                table: "Categorias",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TipoRecorrencia",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "IsGlobal",
                table: "Categorias");
        }
    }
}
