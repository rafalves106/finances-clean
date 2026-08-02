using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoriaEInvestimentoAMeta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoriaId",
                table: "Metas",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvestimentoId",
                table: "Metas",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Metas_CategoriaId",
                table: "Metas",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Metas_InvestimentoId",
                table: "Metas",
                column: "InvestimentoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Metas_Categorias_CategoriaId",
                table: "Metas",
                column: "CategoriaId",
                principalTable: "Categorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Metas_Investimentos_InvestimentoId",
                table: "Metas",
                column: "InvestimentoId",
                principalTable: "Investimentos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Metas_Categorias_CategoriaId",
                table: "Metas");

            migrationBuilder.DropForeignKey(
                name: "FK_Metas_Investimentos_InvestimentoId",
                table: "Metas");

            migrationBuilder.DropIndex(
                name: "IX_Metas_CategoriaId",
                table: "Metas");

            migrationBuilder.DropIndex(
                name: "IX_Metas_InvestimentoId",
                table: "Metas");

            migrationBuilder.DropColumn(
                name: "CategoriaId",
                table: "Metas");

            migrationBuilder.DropColumn(
                name: "InvestimentoId",
                table: "Metas");
        }
    }
}
