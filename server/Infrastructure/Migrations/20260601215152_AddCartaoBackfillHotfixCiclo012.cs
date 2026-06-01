using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCartaoBackfillHotfixCiclo012 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CartaoBackfillExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Modo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SourceExecutionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExecutedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExecutedBy = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    TotalAnalisado = table.Column<int>(type: "integer", nullable: false),
                    TotalAplicavel = table.Column<int>(type: "integer", nullable: false),
                    TotalAmbiguo = table.Column<int>(type: "integer", nullable: false),
                    TotalIgnorado = table.Column<int>(type: "integer", nullable: false),
                    TotalAplicado = table.Column<int>(type: "integer", nullable: false),
                    TotalRevertido = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CartaoBackfillExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CartaoBackfillExecutionItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExecutionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MovimentacaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    CartaoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MotivoStatus = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DescricaoOriginal = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataOriginal = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    DataExtraida = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DataAplicada = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CompetenciaOriginal = table.Column<int>(type: "integer", nullable: true),
                    CompetenciaAplicada = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CartaoBackfillExecutionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CartaoBackfillExecutionItems_CartaoBackfillExecutions_Execu~",
                        column: x => x.ExecutionId,
                        principalTable: "CartaoBackfillExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CartaoBackfillExecutionItems_ExecutionId_Status",
                table: "CartaoBackfillExecutionItems",
                columns: new[] { "ExecutionId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CartaoBackfillExecutionItems_MovimentacaoId",
                table: "CartaoBackfillExecutionItems",
                column: "MovimentacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_CartaoBackfillExecutions_SourceExecutionId",
                table: "CartaoBackfillExecutions",
                column: "SourceExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_CartaoBackfillExecutions_UsuarioId_ExecutedAtUtc",
                table: "CartaoBackfillExecutions",
                columns: new[] { "UsuarioId", "ExecutedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CartaoBackfillExecutionItems");

            migrationBuilder.DropTable(
                name: "CartaoBackfillExecutions");
        }
    }
}
