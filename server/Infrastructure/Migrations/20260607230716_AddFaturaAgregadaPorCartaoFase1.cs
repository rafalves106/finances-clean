using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFaturaAgregadaPorCartaoFase1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EhMovimentacaoFatura",
                table: "Movimentacoes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "FaturaAgregadaId",
                table: "Movimentacoes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FaturasAgregadas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    CartaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Ciclo = table.Column<int>(type: "integer", nullable: false),
                    Vencimento = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ValorTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MovimentacaoId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaturasAgregadas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FaturasAgregadas_CartoesManuais_CartaoId",
                        column: x => x.CartaoId,
                        principalTable: "CartoesManuais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_EhMovimentacaoFatura",
                table: "Movimentacoes",
                column: "EhMovimentacaoFatura");

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_FaturaAgregadaId",
                table: "Movimentacoes",
                column: "FaturaAgregadaId");

            migrationBuilder.CreateIndex(
                name: "IX_FaturasAgregadas_CartaoId",
                table: "FaturasAgregadas",
                column: "CartaoId");

            migrationBuilder.CreateIndex(
                name: "IX_FaturasAgregadas_MovimentacaoId",
                table: "FaturasAgregadas",
                column: "MovimentacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_FaturasAgregadas_UsuarioId_CartaoId_Ciclo",
                table: "FaturasAgregadas",
                columns: new[] { "UsuarioId", "CartaoId", "Ciclo" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Movimentacoes_FaturasAgregadas_FaturaAgregadaId",
                table: "Movimentacoes",
                column: "FaturaAgregadaId",
                principalTable: "FaturasAgregadas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimentacoes_FaturasAgregadas_FaturaAgregadaId",
                table: "Movimentacoes");

            migrationBuilder.DropTable(
                name: "FaturasAgregadas");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_EhMovimentacaoFatura",
                table: "Movimentacoes");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_FaturaAgregadaId",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "EhMovimentacaoFatura",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "FaturaAgregadaId",
                table: "Movimentacoes");
        }
    }
}
