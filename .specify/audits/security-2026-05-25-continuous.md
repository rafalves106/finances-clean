# Auditoria de Segurança Contínua — 2026-05-25

> Por: 🔒 Security Reviewer Agent
> Baseline: PROJECT_MAP.md (25/05/2026)
> Escopo: risco residual real, configuração operacional, exposição de superfície, token no frontend, hardening de runtime e monitoração

---

## 🎯 Veredicto Final

**[✅ APROVADO COM RESSALVAS]**

- Achados críticos (🔴): 0
- Achados altos (🟠): 2
- Achados médios (🟡): 4
- Achados baixos (🟢): 0

Resumo executivo: não há vulnerabilidade crítica explorável imediata no estado atual, mas há risco residual relevante em sessão no frontend e em drift operacional/documental que pode degradar segurança efetiva em produção.

---

## 🟠 Achados Altos

### [SEC-CONT-001] Token JWT persistido em `localStorage` (exposição alta em caso de XSS)

- **Arquivo**: `client/src/services/auth.js:3`
- **Arquivo**: `client/src/services/auth.js:5`
- **Arquivo**: `client/src/services/auth.js:11`
- **Arquivo**: `client/src/components/LoginView.jsx:27`
- **Categoria**: Session Management / Token Exposure
- **OWASP**: A07:2021 – Identification and Authentication Failures
- **Evidência**:
```js
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
Authorization: `Bearer ${getToken()}`
```
- **Exploitabilidade prática**: moderada a alta. Qualquer XSS no contexto do frontend expõe o token diretamente para exfiltração.
- **Impacto de negócio**: sequestro de sessão em conta financeira, acesso a histórico financeiro e operações autenticadas até expiração/revogação.
- **Recomendação objetiva**:
  - Curto prazo: reduzir TTL efetivo já está em 60 min (bom), adicionar rotação/revogação explícita no logout e invalidar sessão em troca de senha.
  - Médio prazo: migrar para cookie `HttpOnly` + `Secure` + `SameSite` com fluxo de refresh token rotativo.

### [SEC-CONT-002] Drift operacional: runbook descreve fluxo/variáveis que não refletem o runtime real

- **Arquivo**: `docs/runbooks/migrations-prod.md:67`
- **Arquivo**: `docs/runbooks/migrations-prod.md:87`
- **Arquivo**: `docs/runbooks/migrations-prod.md:112`
- **Arquivo**: `docker-compose.yml:35`
- **Arquivo**: `server/API/Program.cs:149`
- **Categoria**: Security Misconfiguration / Operability
- **OWASP**: A05:2021 – Security Misconfiguration
- **Evidência**:
  - Runbook documenta endpoints `POST /api/v1/auth/bootstrap-admin` e `POST /api/v1/auth/trocar-senha-temporaria`.
  - `AuthController` implementa apenas `login` e `registro`.
  - Runbook/compose orientam `CORS_ALLOWED_ORIGINS`, enquanto o runtime lê `AllowedOrigins` por seção de config.
- **Exploitabilidade prática**: alta para erro operacional. Em incidente/implantação, operação pode assumir controles inexistentes ou configurar CORS de forma inefetiva.
- **Impacto de negócio**: indisponibilidade de autenticação em produção (origens não autorizadas) ou runbook de recuperação/admin inexequível em janela crítica.
- **Recomendação objetiva**:
  - Curto prazo: alinhar runbook ao código implementado e remover fluxo não existente.
  - Curto prazo: padronizar uma única chave operacional de CORS e mapear no `Program.cs` com parsing explícito (CSV -> array), mantendo fail-fast fora de Development.

---

## 🟡 Achados Médios

### [SEC-CONT-003] OpenAPI/Swagger expostos em runtime sem restrição por ambiente

- **Arquivo**: `server/API/Program.cs:192`
- **Arquivo**: `server/API/Program.cs:220`
- **Arquivo**: `server/API/Program.cs:225`
- **Categoria**: Exposição de superfície
- **OWASP**: A05:2021 – Security Misconfiguration
- **Evidência**:
```csharp
app.MapOpenApi();
app.UseSwaggerUI(...);
app.MapGet("/", () => Results.Redirect("/swagger"));
```
- **Exploitabilidade prática**: moderada. Facilita enumeração de endpoints e contratos por agentes externos quando exposto publicamente.
- **Impacto de negócio**: acelera reconhecimento de superfície para ataques direcionados.
- **Recomendação objetiva**: limitar Swagger/OpenAPI a `Development` ou proteger com autenticação/rede interna em produção.

### [SEC-CONT-004] Hardening HTTP parcial (faltam headers complementares de proteção)

- **Arquivo**: `server/API/Program.cs:203`
- **Arquivo**: `server/API/Program.cs:209`
- **Arquivo**: `server/API/Program.cs:196`
- **Categoria**: Runtime Hardening
- **OWASP**: A05:2021 – Security Misconfiguration
- **Evidência**:
  - Presentes: `X-Frame-Options`, `Content-Security-Policy`, `HSTS`.
  - Não encontrados no backend: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Exploitabilidade prática**: moderada a baixa (depende de vetor específico e de headers do frontend/reverse proxy).
- **Impacto de negócio**: aumento incremental de superfície para ataques de browser/client-side.
- **Recomendação objetiva**: adicionar cabeçalhos complementares no middleware da API (ou via proxy central) com política explícita.

### [SEC-CONT-005] Rate limiting dependente de `RemoteIp` sem tratamento explícito de proxy reverso

- **Arquivo**: `server/API/Program.cs:111`
- **Arquivo**: `server/API/Program.cs:130`
- **Categoria**: Abuse Protection / Operação
- **OWASP**: A05:2021 – Security Misconfiguration
- **Evidência**:
```csharp
var remoteIp = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
var partitionKey = $"{remoteIp}:{endpoint}";
```
  - Não há evidência de `UseForwardedHeaders` no backend.
- **Exploitabilidade prática**: moderada em produção atrás de proxy/CDN; pode gerar false-positive em massa ou reduzir eficácia por identificação incorreta de origem.
- **Impacto de negócio**: bloqueio indevido de usuários legítimos ou menor capacidade de conter abuso real.
- **Recomendação objetiva**: configurar `ForwardedHeaders` de forma segura para preservar IP real em ambiente com proxy confiável.

### [SEC-CONT-006] Monitoração de segurança limitada (sem stack de métricas/tracing detectável)

- **Arquivo**: `server/API/Program.cs:105`
- **Arquivo**: `server/API/Program.cs:117`
- **Categoria**: Logging and Monitoring
- **OWASP**: A09:2021 – Security Logging and Monitoring Failures
- **Evidência**:
  - Existe log de rejeição de rate limiter com `TraceId`/`Path`/`RemoteIp`.
  - Não foi detectada instrumentação de métricas/tracing (`OpenTelemetry`, `/metrics`, `ApplicationInsights`, etc.) nos artefatos auditados.
- **Exploitabilidade prática**: baixa direta, média operacional (detecção tardia de campanhas de abuso e tendência).
- **Impacto de negócio**: tempo maior para detectar/mitigar ataques graduais e para provar eficácia de controles.
- **Recomendação objetiva**: adicionar métricas mínimas de segurança (contadores de 401/403/429 por endpoint/IP) e alerta operacional.

---

## ✅ Verificações que passaram

- ✅ Rate limiting de auth ativo e restrito a endpoints públicos (`login` e `registro`) com `EnableRateLimiting`.
- ✅ Telemetria de rejeição de abuso com `TraceId`, método, path, IP e user-agent no `OnRejected`.
- ✅ JWT com validade limitada e validação de assinatura/issuer/audience/lifetime.
- ✅ Dependências sem vulnerabilidades conhecidas no momento da auditoria:
  - `npm audit --audit-level=moderate`: 0 vulnerabilidades.
  - `dotnet list ... --vulnerable --include-transitive`: 0 vulnerabilidades.
- ✅ Endpoints protegidos continuam sob `[Authorize]` via `AuthenticatedController`.

---

## 📌 Backlog AppSec (30 dias)

### P1 (0-10 dias)

1. **Alinhar documentação operacional ao runtime real**
   - Corrigir `migrations-prod.md` removendo bootstrap não implementado ou implementar endpoints de bootstrap com critérios de uso único auditáveis.
2. **Unificar configuração CORS operacional**
   - Definir padrão único (`AllowedOrigins` section ou variável única com parsing explícito) e validar startup em produção com teste automatizado de configuração.
3. **Reduzir risco de sessão no frontend**
   - Definir plano técnico de migração de `localStorage` para cookie `HttpOnly` com refresh token rotativo.

### P2 (11-20 dias)

1. **Restringir superfície de documentação em produção**
   - Proteger ou desabilitar `MapOpenApi`/`SwaggerUI` fora de `Development`.
2. **Completar hardening de headers HTTP**
   - Incluir `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` com testes de regressão.
3. **Configurar Forwarded Headers para ambientes com proxy/CDN**
   - Garantir IP real no rate limiter e validar comportamento com testes de carga/abuso.

### P3 (21-30 dias)

1. **Observabilidade de segurança mínima**
   - Criar dashboard de 401/403/429 por endpoint e regra de alerta (threshold e tendência).
2. **Evidência contínua de eficácia**
   - Agendar auditoria mensal leve com saída automática em `.specify/audits/`.
3. **Aprimorar resposta a incidente**
   - Runbook de abuso de auth com playbook de contenção e rollback de limiares.

---

## 🛠️ Comandos executados (reprodutibilidade)

```bash
# Baseline e contexto
read_file PROJECT_MAP.md
read_file .specify/memory/constitution.md

# Token/frontend
git grep -nE "localStorage|sessionStorage|Authorization|Bearer|token" -- client/src
read_file client/src/services/auth.js
read_file client/src/components/LoginView.jsx

# Runtime hardening / exposição
git grep -nE "WithOrigins|AllowedOrigins|UseHsts|UseHttpsRedirection|UseRateLimiter|AddRateLimiter|OnRejected|MapOpenApi|UseSwaggerUI|MapGet\(\"/health|MapGet\(\"/ready" -- server/API/Program.cs
read_file server/API/Program.cs

# Fronteira de acesso e escopo de endpoints
git grep -nE "AllowAnonymous|Authorize|EnableRateLimiting" -- server/API/Controllers
read_file server/API/Controllers/AuthController.cs

# Operação e runbook
git grep -nE "CORS_ALLOWED_ORIGINS|AllowedOrigins|BootstrapAdminKey|bootstrap-admin|trocar-senha-temporaria" -- docker-compose.yml docs/runbooks/migrations-prod.md server/API
read_file docker-compose.yml
read_file docs/runbooks/migrations-prod.md
read_file server/API/appsettings.Example.json

# Monitoração/telemetria
git grep -nE "OpenTelemetry|Prometheus|/metrics|ApplicationInsights|Serilog|AddOpenTelemetry|AddHealthChecks" -- server client docs

# Dependências vulneráveis
cd client && npm audit --audit-level=moderate --json
cd server && dotnet list API/API.csproj package --vulnerable --include-transitive
```
