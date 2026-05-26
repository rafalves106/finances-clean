# Changelog

Todas as mudancas notaveis deste projeto sao registradas aqui.

Formato baseado em Keep a Changelog e versionamento por marcos de entrega do produto.

## [Nao publicado]

### Adicionado

- Estrutura inicial de changelog orientada ao PO para acompanhamento de entregas e riscos.

## [0.4.0] - 2026-05-26

### Adicionado

- Modal de release notes com exibicao unica por versao para usuarios autenticados.
- Rodape com versao da aplicacao visivel no sidebar.

### Tecnico

- Versao do app injetada no build via Vite usando define com base no package.json.
- Parser local para extrair a secao da versao atual do CHANGELOG com fallback seguro.

## [0.3.0] - 2026-05-25

### Entrega

- Consolidacao do ciclo 3 com melhorias funcionais e ajustes de estabilidade do frontend.

## [0.1.0] - 2026-05-25

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
