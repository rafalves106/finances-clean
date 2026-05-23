using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    public partial class AddAuth_UsuarioId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Criar tabela Usuarios PRIMEIRO (antes das FKs)
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SenhaHash = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            // 2. Inserir o admin (antes de adicionar as colunas)
            var adminId = new Guid("00000000-0000-0000-0000-000000000001");
            var senhaHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"));

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Nome", "Email", "SenhaHash" },
                values: new object[] { adminId, "Rafael", "rafalves106@icloud.com", senhaHash });

            // 3. Adicionar UsuarioId nas tabelas (registros existentes ficam com Guid.Empty)
            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Movimentacoes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Metas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Investimentos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioId",
                table: "Categorias",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // 4. Atribuir todos os dados existentes ao admin
            foreach (var table in new[] { "Movimentacoes", "Investimentos", "Metas", "Categorias" })
            {
                migrationBuilder.Sql(
                    $"UPDATE \"{table}\" SET \"UsuarioId\" = '{adminId}'");
            }

            // 5. Criar FKs (após os dados estarem consistentes)
            migrationBuilder.AddForeignKey(
                name: "FK_Movimentacoes_Usuarios_UsuarioId",
                table: "Movimentacoes",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Investimentos_Usuarios_UsuarioId",
                table: "Investimentos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Metas_Usuarios_UsuarioId",
                table: "Metas",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Categorias_Usuarios_UsuarioId",
                table: "Categorias",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(name: "FK_Movimentacoes_Usuarios_UsuarioId", table: "Movimentacoes");
            migrationBuilder.DropForeignKey(name: "FK_Investimentos_Usuarios_UsuarioId", table: "Investimentos");
            migrationBuilder.DropForeignKey(name: "FK_Metas_Usuarios_UsuarioId", table: "Metas");
            migrationBuilder.DropForeignKey(name: "FK_Categorias_Usuarios_UsuarioId", table: "Categorias");

            migrationBuilder.DropColumn(name: "UsuarioId", table: "Movimentacoes");
            migrationBuilder.DropColumn(name: "UsuarioId", table: "Metas");
            migrationBuilder.DropColumn(name: "UsuarioId", table: "Investimentos");
            migrationBuilder.DropColumn(name: "UsuarioId", table: "Categorias");

            migrationBuilder.DropTable(name: "Usuarios");
        }
    }
}