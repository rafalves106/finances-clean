# Migrations em producao

Este projeto aplica migrations automaticamente apenas em `Development`.
Em producao, a aplicacao assume que o schema ja foi atualizado manualmente antes de receber trafego.

## Quando rodar

Rode a migration manual sempre que houver uma nova migration no repositorio antes de subir a nova versao da API.

## Pre-requisitos

- Docker e Docker Compose instalados no servidor
- Variaveis de ambiente do backend configuradas
- Banco PostgreSQL acessivel a partir do host ou do container

Variaveis obrigatorias no backend:

- `ConnectionStrings__PostgresConnection`
- `Jwt__Key` (minimo recomendado: 32 caracteres)
- `AdminKey`
- `CORS_ALLOWED_ORIGINS` (lista separada por virgula em ambiente nao local)

Variavel temporaria de bootstrap inicial (uso unico):

- `BootstrapAdminKey`

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

## Bootstrap manual seguro do admin inicial (sem seed de senha)

Quando o ambiente estiver sem usuario administrativo criado, use o endpoint
`POST /api/v1/auth/bootstrap-admin` com chave temporaria para criar o admin inicial.

1. Defina `BootstrapAdminKey` com valor forte e temporario.
2. Reinicie a API para aplicar a variavel.
3. Execute a chamada abaixo (exemplo):

```bash
curl -X POST http://localhost:8080/api/v1/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Key: ${BOOTSTRAP_ADMIN_KEY}" \
  -d '{
    "nome": "Admin Inicial",
    "email": "admin@localhost",
    "senha": "Temp#SenhaForte2026"
  }'
```

4. Realize a troca real da senha temporaria (invalida a senha inicial) com:

```bash
curl -X POST http://localhost:8080/api/v1/auth/trocar-senha-temporaria \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Key: ${BOOTSTRAP_ADMIN_KEY}" \
  -d '{
    "email": "admin@localhost",
    "senhaTemporaria": "Temp#SenhaForte2026",
    "novaSenha": "SenhaFinal#MuitoForte2026"
  }'
```

5. Valide que a senha temporaria foi invalidada tentando login com a senha antiga (deve falhar).
6. Valide login com a nova senha final (deve funcionar).
7. Remova `BootstrapAdminKey` do ambiente e reinicie a API para desabilitar o bootstrap.

Comportamento de uso unico:

- `POST /api/v1/auth/bootstrap-admin` so funciona quando ainda nao existe usuario utilizavel.
- Depois que o primeiro usuario utilizavel existe, novas tentativas de bootstrap retornam conflito (`409`).
- A troca de senha temporaria so fica disponivel durante o bootstrap inicial (1 usuario utilizavel).

Observacao: nunca reutilize senha temporaria entre ambientes e nunca mantenha
`BootstrapAdminKey` habilitada apos o bootstrap inicial.

## CORS allowlist explicita (SEC-002)

A API usa apenas origens explicitas via `CORS_ALLOWED_ORIGINS`.

Formato esperado:

```bash
CORS_ALLOWED_ORIGINS=https://financas.seu-dominio.com,https://app.seu-dominio.com
```

Comportamento de startup:

- Ambiente nao local (`Production`, `Staging`, etc.): `CORS_ALLOWED_ORIGINS` e obrigatoria (fail fast se vazia/ausente).
- Ambiente local (`Development`/`Local`): aceita fallback para `AllowedOrigins` do appsettings de exemplo.

## Rollback

Se a migration falhar, nao suba a nova versao da API. Corrija a migration ou restaure o backup do banco antes de tentar novamente.

## Sincronizacao pos-rewrite de historico (servidor caseiro)

Quando houver `force push` por limpeza de historico, o servidor caseiro deve ser
ressincronizado por re-clone limpo.

### Janela operacional recomendada

1. Definir janela de manutencao (downtime estimado: 10-20 min).
2. Comunicar congelamento de deploy/merge durante a janela.
3. Garantir backup local do workspace atual e dos volumes do banco.

### Procedimento de re-clone seguro

```bash
# no servidor caseiro
mv Finances Finances.pre-rewrite.$(date +%Y%m%d-%H%M%S)
git clone https://github.com/rafalves106/Finances.git Finances
cd Finances
```

### Validacao minima pos-sincronizacao

```bash
dotnet build server/Finance.slnx
curl -f http://localhost:8080/health
curl -f http://localhost:8080/ready
```

### Plano de retorno (rollback)

```bash
# no servidor caseiro
rm -rf Finances
mv Finances.pre-rewrite.<timestamp> Finances
cd Finances
```

Observacao: em caso de rollback para snapshot antigo, manter segredos rotacionados
e nao reativar credenciais previamente comprometidas.
