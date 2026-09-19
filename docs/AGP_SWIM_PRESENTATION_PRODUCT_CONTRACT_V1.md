# AGP SWIM — CONTRATO VISUAL E FUNCIONAL DE PRODUTO V1

Status: CANÔNICO / CONGELADO
Data: 18/09/2026
Escopo: AGP Swim — Natação
Origem: apresentação institucional de 3 lâminas aprovada pelo proprietário.

## REGRA CENTRAL

As três lâminas institucionais deixam de ser apenas representação conceitual e passam a ser referência obrigatória de experiência do produto.

O AGP Swim entregue deve preservar:
- mesma linguagem visual premium;
- mesma organização mental do produto;
- mesmas áreas funcionais apresentadas;
- dados reais derivados do ambiente canônico;
- nenhuma métrica, percentual ou gráfico fictício;
- nenhuma promessa visual que não tenha correspondência funcional;
- nenhuma redução de rigor científico para reproduzir valores ilustrativos.

Quando a lâmina apresentar um valor ilustrativo, o produto deve exibir:
1. o valor real equivalente, se houver evidência válida; ou
2. estado explícito de formação/insuficiência de dados.

## LÂMINA 1 — IDENTIDADE, PERTENCIMENTO E OPERAÇÃO

### Aplicabilidade obrigatória
- marca AGP Sports Intelligence / Natação;
- produto identificado como AGP Swim;
- navegação coerente e visual de produto;
- Master com visão de governança somente leitura;
- treino planejado com volume, intensidade, atletas e conteúdo;
- atleta, técnico/treinador, especialistas e instituição como participantes da mesma história;
- princípio visível: evidência → interpretação → decisão → intervenção → resposta → aprendizado.

### Implementação
- shell visual: `SwimmingShell.jsx`;
- governança: `SwimmingGovernanceHome.jsx`;
- observação de treinos: `MasterTrainingObservability.jsx`;
- atleta: `SwimmingAthleteHome.jsx`;
- técnico: `SwimmingProfessionalHome.jsx`;
- instituição: `SwimmingInstitutionHome.jsx`.

## LÂMINA 2 — CICLO OPERACIONAL

### Contexto esportivo
Deve existir perfil esportivo, categoria, nível, situação federativa e vínculo institucional/projeto.

### Treino planejado
Deve permitir:
- grupo;
- atleta individual;
- volume;
- intensidade;
- objetivo;
- conteúdo;
- séries estruturadas;
- ajustes individuais;
- colagem/importação de Excel;
- persistência de rascunho;
- filtros Todos / Planejados / Em execução / Concluídos.

Implementação principal: `SwimmingTrainingPlanning.jsx`.

### Prontidão diária
Atleta registra autorrelato diário real.
Implementação: `AthleteDailyReadiness.jsx`.

### Evidência operacional
Execução do treino, volume executado, intensidade percebida, conteúdo executado e intercorrências.

### Decisão e intervenção
Fluxo rastreável por evidência.
Implementação: `SwimmingProfessionalWorkflow.jsx`.

### Resposta e aprendizado
Resposta observada e aprendizado longitudinal persistentes.

## LÂMINA 3 — EVOLUÇÃO DO ATLETA

A experiência visual e funcional deve existir para atleta, profissional e Master dentro de seus respectivos escopos.

### Indicadores obrigatórios
- janela de 3, 6 e 12 meses;
- volume planejado;
- volume executado;
- total de sessões;
- sessões concluídas;
- registros de prontidão;
- métricas comparáveis;
- participação competitiva;
- gráfico de progressão mensal de volume.

### Evolução técnica
Nunca utilizar percentual ilustrativo.

Mostrar:
- métrica técnica comparável real + delta, quando houver; ou
- "Em formação" quando a evidência não for suficiente.

Implementação:
- frontend: `AthleteEvolutionDashboard.jsx`;
- backend: `/api/v1/participantes/{participante_id}/evolucao-swimming`.

## NAVEGAÇÃO PROFISSIONAL CANÔNICA

A experiência profissional deve expor:
- Início
- Atletas
- Treinos
- Planejamento
- Acompanhamento
- Relatórios
- Instituição
- Atletas do piloto

As áreas podem compartilhar a mesma fonte de verdade, mas precisam manter clareza de função e rota.

## RELATÓRIOS

Relatórios do técnico, instituição e Master devem utilizar dados reais de evolução e operação, sem ranking global de atletas e sem score sintético substituto.

Implementação: `SwimmingReports.jsx`.

## DADOS E VERDADE

Toda apresentação visual do AGP Swim deve obedecer:
- dado ausente permanece ausente;
- execução não registrada não é estimada;
- percentual técnico só existe com série técnica comparável;
- delta não significa automaticamente melhora/piora;
- Master observa, não opera o atleta;
- competência profissional limita interpretação e ação.

## CRITÉRIO DE ACEITAÇÃO

Nenhuma funcionalidade mostrada nas três lâminas pode permanecer apenas como mockup institucional.

Uma área é considerada entregue somente quando:
1. existe no frontend real;
2. está ligada a dado real/canônico;
3. respeita permissão e papel;
4. possui estado vazio correto;
5. funciona em produção;
6. não utiliza dado sintético como substituto de ausência de evidência.

Este documento é a referência de alinhamento entre apresentação, produto e homologação do AGP Swim.
