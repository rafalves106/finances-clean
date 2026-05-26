using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoMovimentacaoFixa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TipoMovimentacaoFixa",
                table: "Movimentacoes",
                type: "text",
                nullable: false,
                defaultValue: "RecorrenteFixa");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TipoMovimentacaoFixa",
                table: "Movimentacoes");
        }
    }
}
