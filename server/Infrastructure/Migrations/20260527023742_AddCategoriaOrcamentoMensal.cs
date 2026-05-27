using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoriaOrcamentoMensal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "OrcamentoMensal",
                table: "Categorias",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CategoriasOrcamentosUsuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoriaGlobalId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrcamentoMensal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriasOrcamentosUsuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoriasOrcamentosUsuarios_Categorias_CategoriaGlobalId",
                        column: x => x.CategoriaGlobalId,
                        principalTable: "Categorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategoriasOrcamentosUsuarios_CategoriaGlobalId",
                table: "CategoriasOrcamentosUsuarios",
                column: "CategoriaGlobalId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoriasOrcamentosUsuarios_UsuarioId_CategoriaGlobalId",
                table: "CategoriasOrcamentosUsuarios",
                columns: new[] { "UsuarioId", "CategoriaGlobalId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoriasOrcamentosUsuarios");

            migrationBuilder.DropColumn(
                name: "OrcamentoMensal",
                table: "Categorias");
        }
    }
}
