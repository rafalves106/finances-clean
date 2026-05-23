using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MVP_Categorias_Movimentacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoriaId",
                table: "Movimentacoes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_CategoriaId",
                table: "Movimentacoes",
                column: "CategoriaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimentacoes_Categorias_CategoriaId",
                table: "Movimentacoes",
                column: "CategoriaId",
                principalTable: "Categorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimentacoes_Categorias_CategoriaId",
                table: "Movimentacoes");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_CategoriaId",
                table: "Movimentacoes");

            migrationBuilder.DropColumn(
                name: "CategoriaId",
                table: "Movimentacoes");
        }
    }
}
