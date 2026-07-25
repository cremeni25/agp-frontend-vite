# AGP – Sports Intelligence Platform

## Plano Mestre de Evolução até a Entrega Final

**Status do documento:** referência executiva e técnica do projeto  
**Projeto:** AGP – Sports Intelligence Platform  
**Objetivo:** transformar dados esportivos em inteligência estratégica, decisões, previsões e acompanhamento multidisciplinar.

---

## 1. Princípio de execução

O desenvolvimento do AGP seguirá execução contínua e incremental, preservando a arquitetura já validada e evitando alterações visuais não homologadas.

Cada fase será conduzida neste ciclo obrigatório:

1. análise do estado real do código e do banco;
2. implementação técnica;
3. testes automatizados e validações técnicas;
4. publicação em ambiente visual de homologação;
5. contextualização visual com o usuário;
6. registro de aprovação, correções ou pendências;
7. migração para a próxima fase somente após homologação.

A validação visual é um portão de qualidade. Nenhuma fase funcional será considerada concluída apenas por existir no código.

---

## 2. Arquitetura-alvo

A plataforma será organizada em sete camadas integradas:

1. **Experiência e navegação:** Home, divisão, autenticação, cadastro, dashboards e módulos.
2. **Identidade e acesso:** Supabase Auth, sessão, perfis, papéis e permissões.
3. **Domínio esportivo:** atletas, clubes, comissão técnica, modalidades, avaliações, competições e equipe multidisciplinar.
4. **Persistência:** Supabase/PostgreSQL, migrations, integridade referencial, RLS e auditoria.
5. **Serviços e regras:** CRUDs, validações, indicadores, scores, timeline e recomendações.
6. **Inteligência:** analytics, BI, comparativos, projeções, detecção de risco e IA.
7. **Governança:** logs, auditoria, observabilidade, segurança, testes, documentação e operação.

---

## 3. Fases obrigatórias

### Fase 0 — Consolidação e governança técnica

**Objetivo:** criar uma base controlável antes da expansão funcional.

Entregas:

- inventário real do repositório, rotas, componentes, tabelas e integrações;
- registro de decisões arquiteturais;
- padronização de branches, commits e pull requests;
- documentação de ambientes e variáveis;
- estratégia de migrations do Supabase;
- critérios de pronto e critérios de homologação;
- matriz inicial de riscos e dependências.

**Homologação visual:** confirmação de que Home, Divisão, Login, Cadastro e Dashboard Atleta permanecem visualmente íntegros.

### Fase 1 — Autenticação e quatro perfis de acesso

**Objetivo:** garantir entrada segura e redirecionamento coerente para Atleta, Comissão Técnica, Clube e Master.

Entregas:

- vocabulário único de papéis de usuário;
- compatibilidade controlada com valores legados;
- sessão persistente e recuperação segura;
- proteção de rotas por perfil;
- tratamento de perfil ausente ou inválido;
- logout seguro;
- recuperação de senha;
- cadastro orientado por perfil;
- políticas RLS compatíveis com os quatro papéis;
- testes dos fluxos autorizados e negados.

**Homologação visual:** login individual em cada divisão, acesso ao dashboard correto, bloqueio de acesso cruzado e encerramento de sessão.

### Fase 2 — Modelo de dados e cadastro completo do atleta

**Objetivo:** transformar o cadastro inicial em prontuário esportivo modular e persistente.

Entregas:

- revisão e normalização das tabelas existentes;
- identificação única e relacionamento entre auth, perfil e atleta;
- migrations versionadas;
- cadastro principal do atleta;
- dados biológicos;
- dados corporais;
- dados fisiológicos;
- dados biomecânicos;
- dados psicológicos;
- contexto social;
- nutrição;
- lesões;
- competições e resultados;
- plano de ação;
- anexos e evidências;
- validações de campos e integridade referencial;
- autosave ou salvamento modular seguro;
- histórico de alterações.

**Homologação visual:** preenchimento completo de um atleta de teste, edição, persistência após novo login e visualização consolidada.

### Fase 3 — Dashboard do Atleta

**Objetivo:** transformar dados cadastrados em visão prática de acompanhamento individual.

Entregas:

- resumo do perfil;
- status de completude cadastral;
- indicadores principais;
- evolução temporal;
- calendário competitivo;
- competições recentes e próximas;
- lesões e alertas;
- plano de ação;
- timeline do atleta;
- documentos e relatórios;
- estados vazios, carregamento e erros.

**Homologação visual:** leitura completa da jornada do atleta em desktop e dispositivos móveis.

### Fase 4 — Comissão Técnica

**Objetivo:** permitir acompanhamento técnico de atletas autorizados.

Entregas:

- dashboard da comissão;
- lista e busca de atletas;
- filtros por clube, esporte, modalidade, categoria e status;
- visão individual do atleta;
- registro de avaliações técnicas;
- planejamento, metas e intervenções;
- alertas de evolução, risco e ausência de dados;
- permissões de leitura e escrita por vínculo.

**Homologação visual:** comissão acessa somente atletas vinculados, registra avaliação e acompanha evolução.

### Fase 5 — Clubes e Associações

**Objetivo:** fornecer inteligência institucional e gestão de desempenho coletivo.

Entregas:

- dashboard do clube;
- cadastro institucional;
- equipes, categorias e responsáveis;
- gestão de vínculos;
- indicadores agregados;
- comparação entre equipes e períodos;
- mapa de riscos;
- calendário e participação competitiva;
- relatórios institucionais;
- controle de acesso por organização.

**Homologação visual:** clube visualiza sua estrutura, atletas vinculados e indicadores agregados sem acesso indevido a outras organizações.

### Fase 6 — Master e administração

**Objetivo:** administrar toda a plataforma com segurança e rastreabilidade.

Entregas:

- dashboard Master;
- gestão de usuários e papéis;
- gestão de clubes, esportes e modalidades;
- aprovação, bloqueio e correção de vínculos;
- parâmetros globais;
- auditoria;
- logs de ações sensíveis;
- gestão de conteúdo e configurações;
- visão operacional da plataforma.

**Homologação visual:** administração dos principais cadastros, permissões e auditoria em ambiente controlado.

### Fase 7 — Motor de indicadores e score esportivo

**Objetivo:** implementar inteligência determinística, explicável e auditável antes da IA avançada.

Entregas:

- catálogo de indicadores;
- fórmulas versionadas;
- normalização por esporte, modalidade, sexo, idade, categoria e nível;
- score geral e scores dimensionais;
- pesos configuráveis;
- explicação de cada resultado;
- detecção de ausência ou baixa qualidade de dados;
- recálculo controlado;
- histórico de score;
- validação com especialistas.

**Homologação visual:** apresentação de scores, fatores contribuintes, evolução e justificativas compreensíveis.

### Fase 8 — Relatórios, exportações e comparativos

**Objetivo:** permitir análise formal e compartilhamento controlado da informação.

Entregas:

- relatórios individuais;
- relatórios técnicos;
- relatórios institucionais;
- exportação PDF e dados autorizados;
- comparativos entre períodos;
- comparativos entre atletas compatíveis;
- comparativos entre equipes e clubes;
- filtros e seleção de indicadores;
- marca d'água, autoria e data de geração;
- trilha de auditoria das exportações.

**Homologação visual:** geração, conferência e download de relatórios com dados consistentes.

### Fase 9 — Business Intelligence e Analytics

**Objetivo:** fornecer exploração analítica e inteligência de gestão.

Entregas:

- painéis analíticos;
- tendências e distribuições;
- funis de completude e acompanhamento;
- mapas de risco;
- coortes e segmentações;
- comparação entre modalidades;
- benchmarks internos;
- indicadores operacionais da plataforma;
- filtros persistentes e compartilháveis.

**Homologação visual:** usuários autorizados exploram dados e chegam aos mesmos resultados ao repetir os filtros.

### Fase 10 — Motor de recomendações e IA

**Objetivo:** acrescentar inteligência preditiva e assistiva sobre uma base governada.

Entregas:

- casos de uso priorizados;
- recomendação de ações com justificativa;
- projeção de desempenho;
- sinalização de potencial esportivo;
- sinalização de risco de lesão sem substituir avaliação profissional;
- análise longitudinal;
- benchmark controlado;
- registro de versão do modelo;
- rastreabilidade de entradas e saídas;
- revisão humana obrigatória em decisões sensíveis;
- monitoramento de qualidade, viés e deriva.

**Homologação visual:** recomendações contextualizadas, explicáveis e aprovadas por especialista antes de uso operacional.

### Fase 11 — Notificações, agenda e calendário competitivo

**Objetivo:** transformar inteligência em acompanhamento ativo.

Entregas:

- central de notificações;
- preferências por usuário;
- agenda de avaliações;
- calendário competitivo;
- lembretes e alertas;
- notificações de pendências;
- eventos e convocações;
- registro de leitura e entrega.

**Homologação visual:** criação de evento, recebimento de alerta e atualização do status pelo usuário.

### Fase 12 — Segurança, privacidade e conformidade

**Objetivo:** proteger dados pessoais e esportivos em toda a operação.

Entregas:

- revisão integral de RLS;
- princípio do menor privilégio;
- proteção de rotas e endpoints;
- gestão segura de segredos;
- consentimento e bases de tratamento;
- retenção e exclusão de dados;
- exportação de dados do titular;
- auditoria de acessos;
- políticas para menores de idade;
- revisão LGPD;
- plano de resposta a incidentes.

**Homologação:** testes de autorização, isolamento entre organizações e evidências de auditoria.

### Fase 13 — Qualidade, desempenho e observabilidade

**Objetivo:** tornar o AGP estável e operável em produção.

Entregas:

- testes unitários;
- testes de integração;
- testes end-to-end;
- testes de acessibilidade;
- testes responsivos;
- monitoramento de erros;
- métricas de desempenho;
- logs estruturados;
- alertas operacionais;
- otimização de consultas;
- paginação e cache onde aplicável;
- backup e recuperação.

**Homologação:** execução dos cenários críticos sem erros bloqueadores e dentro dos critérios de desempenho definidos.

### Fase 14 — Preparação e lançamento

**Objetivo:** concluir a entrega operacional do produto.

Entregas:

- ambiente de produção;
- domínio, SSL e configurações finais;
- migrations de produção;
- dados iniciais controlados;
- plano de implantação;
- checklist de rollback;
- manual do usuário;
- manual administrativo;
- documentação técnica;
- treinamento;
- aceite final;
- monitoramento pós-lançamento.

**Homologação final:** execução completa da jornada de Atleta, Comissão Técnica, Clube e Master no site publicado.

---

## 4. Ordem protocolar de desenvolvimento

A ordem de execução é vinculante:

1. consolidar governança e inventário;
2. concluir autenticação e permissões;
3. estabilizar banco e migrations;
4. concluir cadastro e prontuário do atleta;
5. concluir Dashboard Atleta;
6. concluir Comissão Técnica;
7. concluir Clube;
8. concluir Master;
9. implementar indicadores e score;
10. implementar relatórios e comparativos;
11. implementar BI e Analytics;
12. implementar recomendações e IA;
13. implementar notificações e agenda;
14. concluir segurança, qualidade e observabilidade;
15. homologar e lançar.

A IA não antecederá a governança dos dados, o score determinístico e os mecanismos de auditoria.

---

## 5. Critérios obrigatórios para concluir uma etapa

Uma etapa somente será concluída quando possuir:

- código versionado;
- banco versionado quando aplicável;
- validação de permissões;
- tratamento de carregamento, vazio e erro;
- teste do fluxo principal;
- teste de acesso indevido;
- documentação atualizada;
- publicação em ambiente visual;
- contextualização visual com o usuário;
- homologação registrada.

---

## 6. Estado inicial confirmado no repositório

A auditoria inicial confirmou:

- frontend React 18 com Vite;
- React Router para navegação;
- Supabase JS para autenticação e dados;
- rotas para Home, Divisão, Login, Cadastro e quatro dashboards;
- proteção de rotas baseada em perfil;
- duas configurações distintas de cliente Supabase;
- inconsistências entre os identificadores `atleta`/`atletas` e `clube`/`clubes`;
- redirecionamento legado para uma rota inexistente de clubes;
- existência de páginas dos quatro dashboards no roteamento, embora o nível funcional de cada página ainda precise ser inventariado;
- cadastro atual ainda acoplado ao perfil de atleta;
- necessidade de alinhar o cadastro manual com o trigger declarado para `perfis_atletas`.

---

## 7. Primeira frente em execução

A primeira frente técnica é a **Fase 1 — Autenticação e quatro perfis**.

Escopo inicial:

- centralizar a configuração dos perfis;
- normalizar valores legados;
- corrigir redirecionamentos;
- fortalecer sincronização de sessão e perfil;
- manter compatibilidade com `tipo_usuario` e `funcao` durante a transição;
- preparar a auditoria do trigger e das políticas RLS;
- preservar integralmente a identidade visual homologada.

---

## 8. Registro de homologações

Cada homologação deverá registrar:

- fase;
- versão/commit;
- URL do ambiente;
- usuário/perfil utilizado;
- cenários testados;
- evidências visuais;
- correções solicitadas;
- resultado: aprovado, aprovado com ressalvas ou reprovado;
- autorização para seguir à próxima fase.
