using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompetenciaFaturaCartaoCiclo011 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompetenciaFatura",
                table: "Movimentacoes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_CompetenciaFatura",
                table: "Movimentacoes",
                column: "CompetenciaFatura");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_CompetenciaFatura",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "CompetenciaFatura",
                table: "Movimentacoes");
        }
    }
}
