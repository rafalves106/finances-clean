# Migrations em producao

Este projeto aplica migrations automaticamente apenas em `Development`.
Em producao, a aplicacao assume que o schema ja foi atualizado manualmente antes de receber trafego.

## Quando rodar

Rode a migration manual sempre que houver uma nova migration no repositorio antes de subir a nova versao da API.

## Pre-requisitos

- Docker e Docker Compose instalados no servidor
- Variaveis de ambiente do backend configuradas
- Banco PostgreSQL acessivel a partir do host ou do container

## Opcao 1: rodar no host com .NET SDK

Na raiz de `server/`:

```bash
dotnet ef database update --project Infrastructure --startup-project API
```

## Opcao 2: rodar dentro de um container temporario

Se o servidor nao tiver o .NET SDK instalado, use um container do SDK montando o codigo da aplicacao:

```bash
docker run --rm \
  --network host \
  -v "$(pwd)/server:/src" \
  -w /src \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  dotnet ef database update --project Infrastructure --startup-project API
```

Se o servidor nao suportar `--network host`, ajuste a `ConnectionStrings__PostgresConnection` para apontar para o host correto do banco.

## Validacao

Depois de aplicar a migration:

```bash
curl -f http://localhost:8080/ready
```

Resposta esperada:

```json
{ "status": "ready", "timestamp": "..." }
```

## Rollback

Se a migration falhar, nao suba a nova versao da API. Corrija a migration ou restaure o backup do banco antes de tentar novamente.
