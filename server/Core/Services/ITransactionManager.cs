namespace Finance.Core.Services;

public interface ITransactionManager
{
    void Execute(Action operation);
}