# Validacao Final — Parcelamento Inteligente (Ciclo 3)

## Backend

- [x] Migration `AddTipoMovimentacaoFixa` gerada com comando EF exigido.
- [x] `dotnet ef database update` executado com sucesso.
- [x] Rollback local validado para `20260509155548_AddVeiculoAndUpdateMovimentacao` e reaplicacao da migration.
- [x] `dotnet build` verde apos implementacao das tasks.
- [x] `dotnet test` verde apos implementacao das tasks.

## Frontend

- [x] Modal exibe escolha explicita `Parcelada | Recorrente Fixa` para movimentacao fixa.
- [x] Payload inclui `tipoMovimentacaoFixa` com default seguro.
- [x] Dashboard permite renumerar grupo por `grupoRecorrenciaId`.
- [x] Requisicao de renumeracao usa autenticacao por cookie com `credentials: "include"`.
- [x] `npm run lint`, `npm run build` e `npm test` verdes durante a execucao.

## Regras de Negocio

- [x] Parcelada gera titulos `1/N..N/N`.
- [x] Recorrente fixa preserva titulo base sem sufixo automatico.
- [x] Renumeracao retroativa remove apenas sufixo terminal `\d+/\d+` e reaplica sequencia ordenada por data.
