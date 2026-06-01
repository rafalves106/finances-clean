using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCartaoVisualizadorMvp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CartaoId",
                table: "Movimentacoes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CartoesManuais",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LimiteTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DiaFechamento = table.Column<int>(type: "integer", nullable: false),
                    DiaVencimento = table.Column<int>(type: "integer", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CartoesManuais", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_CartaoId",
                table: "Movimentacoes",
                column: "CartaoId");

            migrationBuilder.CreateIndex(
                name: "IX_CartoesManuais_UsuarioId_Ativo",
                table: "CartoesManuais",
                columns: new[] { "UsuarioId", "Ativo" },
                unique: true,
                filter: "\"Ativo\" = true");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimentacoes_CartoesManuais_CartaoId",
                table: "Movimentacoes",
                column: "CartaoId",
                principalTable: "CartoesManuais",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimentacoes_CartoesManuais_CartaoId",
                table: "Movimentacoes");

            migrationBuilder.DropTable(
                name: "CartoesManuais");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_CartaoId",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "CartaoId",
                table: "Movimentacoes");
        }
    }
}
