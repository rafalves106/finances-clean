using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVeiculoAndUpdateMovimentacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Km",
                table: "Movimentacoes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VeiculoId",
                table: "Movimentacoes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Veiculos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Marca = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Modelo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ano = table.Column<int>(type: "integer", nullable: false),
                    Placa = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    AlertaKm = table.Column<int>(type: "integer", nullable: false),
                    UltimoKmAlerta = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veiculos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_VeiculoId",
                table: "Movimentacoes",
                column: "VeiculoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimentacoes_Veiculos_VeiculoId",
                table: "Movimentacoes",
                column: "VeiculoId",
                principalTable: "Veiculos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimentacoes_Veiculos_VeiculoId",
                table: "Movimentacoes");

            migrationBuilder.DropTable(
                name: "Veiculos");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_VeiculoId",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "Km",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "VeiculoId",
                table: "Movimentacoes");
        }
    }
}
