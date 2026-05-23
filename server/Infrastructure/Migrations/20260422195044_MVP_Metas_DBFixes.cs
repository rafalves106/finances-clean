using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MVP_Metas_DBFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Valor",
                table: "TransacoesInvestimento",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "TransacoesInvestimento",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "Descricao",
                table: "Movimentacoes",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<decimal>(
                name: "ValorRetirado",
                table: "Investimentos",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "ValorAplicado",
                table: "Investimentos",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "TaxaRendimento",
                table: "Investimentos",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "SaldoAtual",
                table: "Investimentos",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.CreateTable(
                name: "Metas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DataAlvo = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Concluida = table.Column<bool>(type: "boolean", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Metas", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_Data",
                table: "Movimentacoes",
                column: "Data");

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_InvestimentoId",
                table: "Movimentacoes",
                column: "InvestimentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Movimentacoes_Tipo",
                table: "Movimentacoes",
                column: "Tipo");

            migrationBuilder.CreateIndex(
                name: "IX_Investimentos_Ativo",
                table: "Investimentos",
                column: "Ativo");

            migrationBuilder.AddForeignKey(
                name: "FK_Movimentacoes_Investimentos_InvestimentoId",
                table: "Movimentacoes",
                column: "InvestimentoId",
                principalTable: "Investimentos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Movimentacoes_Investimentos_InvestimentoId",
                table: "Movimentacoes");

            migrationBuilder.DropTable(
                name: "Metas");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_Data",
                table: "Movimentacoes");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_InvestimentoId",
                table: "Movimentacoes");

            migrationBuilder.DropIndex(
                name: "IX_Movimentacoes_Tipo",
                table: "Movimentacoes");

            migrationBuilder.DropIndex(
                name: "IX_Investimentos_Ativo",
                table: "Investimentos");

            migrationBuilder.AlterColumn<decimal>(
                name: "Valor",
                table: "TransacoesInvestimento",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<int>(
                name: "Tipo",
                table: "TransacoesInvestimento",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Descricao",
                table: "Movimentacoes",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "ValorRetirado",
                table: "Investimentos",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "ValorAplicado",
                table: "Investimentos",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "TaxaRendimento",
                table: "Investimentos",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,4)",
                oldPrecision: 18,
                oldScale: 4,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "SaldoAtual",
                table: "Investimentos",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);
        }
    }
}
