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
    public DbSet<CartaoBackfillExecution> CartaoBackfillExecutions { get; set; }
    public DbSet<CartaoBackfillExecutionItem> CartaoBackfillExecutionItems { get; set; }

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
            entity.Property(e => e.CompetenciaFatura).IsRequired(false);

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
            entity.HasIndex(e => e.CompetenciaFatura);
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

        // --- CartaoBackfillExecution ---
        modelBuilder.Entity<CartaoBackfillExecution>(entity =>
        {
            entity.ToTable("CartaoBackfillExecutions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.Property(e => e.Modo).IsRequired().HasMaxLength(20);
            entity.Property(e => e.SourceExecutionId).IsRequired(false);
            entity.Property(e => e.ExecutedAtUtc).IsRequired();
            entity.Property(e => e.ExecutedBy).IsRequired().HasMaxLength(120);
            entity.Property(e => e.TotalAnalisado).IsRequired();
            entity.Property(e => e.TotalAplicavel).IsRequired();
            entity.Property(e => e.TotalAmbiguo).IsRequired();
            entity.Property(e => e.TotalIgnorado).IsRequired();
            entity.Property(e => e.TotalAplicado).IsRequired();
            entity.Property(e => e.TotalRevertido).IsRequired();

            entity.HasIndex(e => new { e.UsuarioId, e.ExecutedAtUtc });
            entity.HasIndex(e => e.SourceExecutionId);

            entity.HasQueryFilter(e =>
                _currentUserService == null ||
                !_currentUserService.UsuarioId.HasValue ||
                e.UsuarioId == _currentUserService.UsuarioId);
        });

        // --- CartaoBackfillExecutionItem ---
        modelBuilder.Entity<CartaoBackfillExecutionItem>(entity =>
        {
            entity.ToTable("CartaoBackfillExecutionItems");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExecutionId).IsRequired();
            entity.Property(e => e.MovimentacaoId).IsRequired();
            entity.Property(e => e.CartaoId).IsRequired(false);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.MotivoStatus).IsRequired().HasMaxLength(80);
            entity.Property(e => e.DescricaoOriginal).HasMaxLength(500).IsRequired(false);
            entity.Property(e => e.DataOriginal).IsRequired();
            entity.Property(e => e.DataExtraida).IsRequired(false);
            entity.Property(e => e.DataAplicada).IsRequired(false);
            entity.Property(e => e.CompetenciaOriginal).IsRequired(false);
            entity.Property(e => e.CompetenciaAplicada).IsRequired(false);

            entity.HasOne<CartaoBackfillExecution>()
                .WithMany(e => e.Itens)
                .HasForeignKey(e => e.ExecutionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.ExecutionId, e.Status });
            entity.HasIndex(e => e.MovimentacaoId);
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