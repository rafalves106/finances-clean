# ADR 2026-05-23 - Hardening de Rate Limiting para Auth Publica

Status: Aceito
Data: 2026-05-23

## Contexto

O ciclo SEC-014 fechou a proteção contra abuso nos endpoints públicos de auth. O controle de rate limiting estava funcional, mas a trilha de governança ainda precisava registrar a decisão de hardening aplicada.

## Decisão

- Manter rate limiting específico por endpoint e por IP para `POST /api/v1/auth/login` e `POST /api/v1/auth/registro`.
- Usar janela fixa de 1 minuto.
- Aplicar limite de `5 req/min` para login e `3 req/min` para registro.
- Registrar telemetria de rejeição com `TraceIdentifier`, `Method`, `Path`, `RemoteIp` e `UserAgent`.

## Consequencias

- Melhora a investigação de incidentes de abuso sem alterar a eficácia do bloqueio.
- Reduz a probabilidade de falso-positivo em registro com limite mais estrito e monitorável.
- Fortalece a rastreabilidade documental para auditorias futuras.

## Alternativas consideradas

- Manter `5 req/min` uniforme para ambos os endpoints: mais simples, porém menos alinhado ao perfil de risco do registro.
- Aumentar a complexidade com bloqueio progressivo imediato: rejeitado neste momento para preservar simplicidade operacional.
