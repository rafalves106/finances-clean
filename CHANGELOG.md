# Changelog

Todas as mudancas notaveis deste projeto sao registradas aqui.

Formato baseado em Keep a Changelog e versionamento por marcos de entrega do produto.

## [Nao publicado]

### Adicionado

- Estrutura inicial de changelog orientada ao PO para acompanhamento de entregas e riscos.

## [Ciclo 1 - Seguranca e Governanca Minima] - 2026-05-25

### Seguranca

- SEC-014 concluido com hardening de rate limiting nos endpoints publicos de autenticacao.
- Limites por endpoint e IP aplicados para login e registro em janela fixa de 1 minuto.
- Telemetria de rejeicao de rate limiting registrada para facilitar investigacao operacional.

### Corrigido

- Bloqueantes do ciclo tratados para reduzir risco critico imediato de exposicao e abuso.
- Ajustes de governanca e rastreabilidade documental do ciclo de seguranca.

### Entregue para negocio

- Maior resiliencia da autenticacao contra abuso automatizado.
- Melhor capacidade de diagnostico em incidente de auth publica.
- Base minima para continuidade segura da evolucao do produto.

### Risco residual

- Ausencia de esteira CI/CD automatizada no repositorio.
- Cobertura de testes automatizados ainda nao institucionalizada para todos os fluxos criticos.
- Necessidade de manter disciplina operacional na configuracao de ambiente fora de Development.
