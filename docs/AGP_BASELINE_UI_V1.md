# AGP — Linha de base operacional V1

A Central de Participantes passa a concentrar consentimento, linha de base e elegibilidade analítica.

## Regra operacional

Um atleta somente aparece como apto para análise quando possui simultaneamente:

- consentimento vigente para monitoramento esportivo;
- linha de base completa e vigente;
- vínculo ativo com o projeto.

## Campos mínimos da linha de base

Categoria, idade cronológica, sexo registrado, modalidade, altura, massa corporal, data de referência e origem dos dados.

## Proteção

A interface comunica a pendência, mas a proteção definitiva permanece no PostgreSQL por meio da função `agp_pode_analisar` e do trigger sobre `agp_resultados_analiticos`.
