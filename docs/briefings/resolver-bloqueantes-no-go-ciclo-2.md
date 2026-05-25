# Briefing — Resolver Bloqueantes do NO-GO: Ciclo 2

> Capturado em: 25 de maio de 2026
> Por: 🧭 Discovery Agent (com Rafael)
> Status: 🟢 Pronto pra execução

## 1. Persona

Rafael (único dev, PO e usuário). Acabou de fechar o Ciclo 1 de segurança e quer desbloquear o projeto para iniciar novas features com qualidade rastreável.

## 2. Dor real

O Validation Agent emitiu ❌ NO-GO com 7 bloqueantes. O projeto está funcional em produção, mas sem quality gates, com runbook incorreto e com risco de sessão em aberto. Não é possível evoluir com confiança sem resolver esses pontos.

## 3. Valor entregue

Ao fechar os 7 bloqueantes:
- Validação re-executada com veredito GO
- Novas features podem ser especificadas e implementadas com rastreabilidade
- Risco operacional de incidente com runbook inválido eliminado
- Risco de sequestro de sessão financeira mitigado

## 4. Critério de sucesso (KPIs)

- `dotnet build /p:TreatWarningsAsErrors=true` passa sem erros
- `npm test` executa e passa (mínimo 1 suite)
- `dotnet test Finance.slnx` tem pelo menos 1 projeto de testes na solução
- `docs/runbooks/migrations-prod.md` não cita endpoints inexistentes
- `test-plan.md` existe em `specs/001-eliminar-criticos-seguranca/`
- Simulador de investimentos retorna resultado válido com taxa = 0
- README raiz + CHANGELOG existem na raiz do repositório
- Token de sessão servido via cookie HttpOnly (não mais localStorage)
- Validation Agent re-executado com veredito ✅ GO

## 5. Escopo

**Dentro:**
- Corrigir os 7 bloqueantes do `validation-2026-05-25.md` na ordem definida abaixo
- Re-executar o Validation Agent ao final para confirmar GO

**Fora (explicitamente):**
- Novas features (dashboard, relatórios, novos módulos)
- Melhorias incrementais P2 (Swagger, headers extras, métricas)
- Refatorações além do necessário para fechar os bloqueantes

## 6. Restrições

- Sem prazo externo (projeto pessoal)
- Alterações devem ser commitadas individualmente por bloqueante para rastreabilidade
- Nenhuma mudança de schema de banco neste ciclo

## 7. Ordem de ataque (prioridade por esforço crescente)

| Ordem | # | Bloqueante | Esforço estimado | Agente |
|---|---|---|---|---|
| 1 | B4 | Corrigir CS8604 em `MovimentacoesController.cs` | < 30 min | 💻 Dev |
| 2 | B2 | Corrigir runbook (remover endpoints inexistentes) | < 1h | 💻 Dev / 📝 Tech Writer |
| 3 | B6 | Corrigir taxa 0 no simulador de investimentos | < 1h | 💻 Dev |
| 4 | B5 | Criar `test-plan.md` formal para o ciclo 001 | < 1h | 🏛️ Architect |
| 5 | B7 | Criar README raiz + CHANGELOG básico | < 2h | 📝 Tech Writer |
| 6 | B3 | Criar script de teste frontend mínimo | 2–4h | 🧪 QA + 💻 Dev |
| 7 | B1 | Migrar token JWT para cookie HttpOnly | 4–8h | 🏛️ Architect + 💻 Dev |

## 8. Premissas e riscos de produto

- B4 (CS8604) é isolado e não tem dependência. Começa aqui.
- B2 (runbook) é correção de documentação, sem risco técnico.
- B7 (B1 - cookie HttpOnly) é o mais complexo: requer mudança coordenada em backend + frontend. Deixar por último.
- Nenhum bloqueante depende de outro, exceto B1 que idealmente tem B3 (testes) como pré-requisito de validação.

## 9. Próximo passo imediato

🎯 **Acionar 💻 Dev Agent** com este prompt:

> "Corrija o warning CS8604 em `server/API/Controllers/Movimentacao/MovimentacoesController.cs` linha 35. O warning é de nullable reference. Faça a correção mínima necessária para que `dotnet build /p:TreatWarningsAsErrors=true` passe sem erros. Não refatore além do necessário."
