using Microsoft.EntityFrameworkCore;
using Finance.Core.Domain;
using Finance.Infrastructure.Data.Configurations;
using Finance.Core.Services;

namespace Finance.Infrastructure.Data;

public class FinanceDbContext : DbContext
{
    public DbSet<Movimentacao> Movimentacoes { get; set; }
    public DbSet<Entrada> Entradas { get; set; }
    public DbSet<Saida> Saidas { get; set; }
    public DbSet<Investimento> Investimentos { get; set; }
    public DbSet<TransacaoInvestimento> TransacoesInvestimento { get; set; }
    public DbSet<Meta> Metas { get; set; }
    public DbSet<Categoria> Categorias { get; set; }
    public DbSet<CategoriaOrcamentoUsuario> CategoriasOrcamentosUsuarios { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Veiculo> Veiculos { get; set; }
    public DbSet<CartaoManual> CartoesManuais { get; set; }

    private readonly ICurrentUserService? _currentUserService;

    // ← Construtor para migrations (design-time) — sem ICurrentUserService
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options) { }

    // ← Construtor para runtime — com ICurrentUserService via DI
    public FinanceDbContext(
        DbContextOptions<FinanceDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // --- Movimentacao ---
        modelBuilder.Entity<Movimentacao>()
            .HasDiscriminator<TipoMovimentacao>("Tipo")
            .HasValue<Entrada>(TipoMovimentacao.Entrada)
            .HasValue<Saida>(TipoMovimentacao.Saida);

        modelBuilder.Entity<Movimentacao>()
            .Property(e => e.Tipo)
            .HasConversion<string>();

        modelBuilder.Entity<Movimentacao>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Titulo).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Descricao).HasMaxLength(500).IsRequired(false);
            entity.Property(e => e.Valor).HasPrecision(18, 2);
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.Property(e => e.TipoRecorrencia).HasConversion<string>();
            entity.Property(e => e.TipoMovimentacaoFixa)
                .HasConversion<string>()
                .HasDefaultValue(TipoMovimentacaoFixa.RecorrenteFixa);

            entity.HasOne<Investimento>()
                  .WithMany()
                  .HasForeignKey(m => m.InvestimentoId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<CartaoManual>()
                .WithMany()
                .HasForeignKey(m => m.CartaoId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Categoria)
                  .WithMany()
                  .HasForeignKey(e => e.CategoriaId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            // VeiculoId e Km
            entity.Property(m => m.VeiculoId).IsRequired(false);
            entity.Property(m => m.Km).IsRequired(false);

            entity.HasOne<Veiculo>()
                  .WithMany()
                  .HasForeignKey(m => m.VeiculoId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Data);
            entity.HasIndex(e => e.Tipo);
            entity.HasIndex(e => e.InvestimentoId);
            entity.HasIndex(e => e.CartaoId);
            entity.HasIndex(m => m.VeiculoId);

            entity.HasQueryFilter(m =>
                _currentUserService == null ||
                !_currentUserService.UsuarioId.HasValue ||
                m.UsuarioId == _currentUserService.UsuarioId);
        });

        // --- TransacaoInvestimento ---
        modelBuilder.Entity<TransacaoInvestimento>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Tipo).HasConversion<string>();
            entity.Property(e => e.Valor).HasPrecision(18, 2);
        });

        // --- Meta ---
        modelBuilder.Entity<Meta>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Descricao).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Valor).HasPrecision(18, 2);
            entity.Property(e => e.UsuarioId).IsRequired();

            entity.HasQueryFilter(m =>
                _currentUserService == null ||
                !_currentUserService.UsuarioId.HasValue ||
                m.UsuarioId == _currentUserService.UsuarioId);
        });

        // --- Categoria ---
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Icone).HasMaxLength(10);
            entity.Property(e => e.Cor).HasMaxLength(7);
            entity.Property(e => e.OrcamentoMensal).HasPrecision(18, 2);
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.Property(e => e.IsGlobal).HasDefaultValue(false);

            entity.HasQueryFilter(c =>
                c.IsGlobal ||
                _currentUserService == null ||
                !_currentUserService.UsuarioId.HasValue ||
                c.UsuarioId == _currentUserService.UsuarioId);
        });

        // --- CategoriaOrcamentoUsuario ---
        modelBuilder.Entity<CategoriaOrcamentoUsuario>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CategoriaGlobalId).IsRequired();
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.Property(e => e.OrcamentoMensal).HasPrecision(18, 2).IsRequired();

            entity.HasOne<Categoria>()
                .WithMany()
                .HasForeignKey(e => e.CategoriaGlobalId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.UsuarioId, e.CategoriaGlobalId }).IsUnique();

            entity.HasQueryFilter(e =>
                _currentUserService == null ||
                !_currentUserService.UsuarioId.HasValue ||
                e.UsuarioId == _currentUserService.UsuarioId);
        });

        // --- Veiculo ---
        modelBuilder.Entity<Veiculo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Marca).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Modelo).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Placa).IsRequired().HasMaxLength(10);
            entity.Property(e => e.UsuarioId).IsRequired();

            // Row-Level Security — igual ao padrão de Meta e Categoria
            entity.HasQueryFilter(v =>
                _currentUserService == null ||
                !_currentUserService.UsuarioId.HasValue ||
                v.UsuarioId == _currentUserService.UsuarioId);
        });

        // --- CartaoManual ---
        modelBuilder.Entity<CartaoManual>(entity =>
        {
            entity.ToTable("CartoesManuais");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LimiteTotal).HasPrecision(18, 2);
            entity.Property(e => e.DiaFechamento).IsRequired();
            entity.Property(e => e.DiaVencimento).IsRequired();
            entity.Property(e => e.Ativo).IsRequired();
            entity.Property(e => e.CreatedAtUtc).IsRequired();
            entity.Property(e => e.UpdatedAtUtc).IsRequired();

            entity.HasIndex(e => new { e.UsuarioId, e.Ativo })
                .IsUnique()
                .HasFilter("\"Ativo\" = true");

            entity.HasQueryFilter(c =>
            _currentUserService == null ||
            !_currentUserService.UsuarioId.HasValue ||
            c.UsuarioId == _currentUserService.UsuarioId);
        });

        // --- Usuario ---
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
        });

        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new InvestimentoConfiguration());

        modelBuilder.Entity<Investimento>()
        .HasQueryFilter(i =>
            _currentUserService == null ||
            !_currentUserService.UsuarioId.HasValue ||
            i.UsuarioId == _currentUserService.UsuarioId);
    }
}