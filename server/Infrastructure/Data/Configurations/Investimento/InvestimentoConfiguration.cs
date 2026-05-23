using Finance.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finance.Infrastructure.Data.Configurations;

public class InvestimentoConfiguration : IEntityTypeConfiguration<Investimento>
{
    public void Configure(EntityTypeBuilder<Investimento> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.UsuarioId).IsRequired();
        builder.Property(e => e.Nome).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Instituicao).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Tipo).HasConversion<string>();
        builder.Property(e => e.TipoRentabilidade).HasConversion<string>();
        builder.Property(e => e.Liquidez).HasConversion<string>();
        builder.Property(e => e.ValorAplicado).HasPrecision(18, 2);
        builder.Property(e => e.ValorRetirado).HasPrecision(18, 2);
        builder.Property(e => e.SaldoAtual).HasPrecision(18, 2);
        builder.Property(e => e.TaxaRendimento).HasPrecision(18, 4);

        builder.HasIndex(e => e.Ativo);

        // ← HasMany/WithOne, não OwnsMany
        builder.HasMany(e => e.Transacoes)
               .WithOne(t => t.Investimento)
               .HasForeignKey(t => t.InvestimentoId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}