using Finance.Core.Services;
using Finance.Infrastructure.Data;

namespace Finance.Infrastructure.Services;

public class TransactionManager(FinanceDbContext dbContext) : ITransactionManager
{
    public void Execute(Action operation)
    {
        using var transaction = dbContext.Database.BeginTransaction();

        try
        {
            operation();
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}