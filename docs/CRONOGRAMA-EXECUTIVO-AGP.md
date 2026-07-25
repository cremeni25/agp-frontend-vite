# AGP – Cronograma Executivo de Desenvolvimento, Publicação e Homologação

## 1. Regra operacional obrigatória

Toda alteração funcional do AGP seguirá o mesmo ciclo de controle:

1. análise técnica e definição do escopo;
2. criação de branch exclusiva;
3. desenvolvimento e documentação;
4. abertura ou atualização de Pull Request;
5. validação automática de instalação e build pelo GitHub Actions;
6. correção integral de falhas antes do merge;
7. publicação de preview para inspeção técnica;
8. merge na branch `main` somente após validações técnicas;
9. publicação sincronizada na Vercel e no Render;
10. conferência técnica das duas publicações;
11. apresentação visual ao usuário;
12. homologação, registro de ressalvas ou reprovação;
13. encerramento da etapa;
14. abertura da etapa seguinte.

Nenhuma funcionalidade será declarada concluída apenas porque foi gravada no GitHub.

---

## 2. Ambientes oficiais do ciclo

### GitHub

Função:

- fonte oficial do código;
- branches de trabalho;
- Pull Requests;
- validações automáticas;
- histórico de alterações;
- controle de versões e rollback.

### Vercel

Função:

- preview de Pull Requests e branches;
- primeira conferência visual e funcional;
- validação rápida do frontend antes da produção consolidada.

### Render

Função:

- ambiente publicado atualmente associado ao AGP;
- segunda validação de produção;
- conferência de compatibilidade com o serviço já existente;
- publicação estável até a ativação do domínio oficial.

### UOL Host

Função:

- contratação e administração do domínio oficial;
- configuração futura de DNS;
- apontamento do domínio para o ambiente definitivo;
- manutenção da propriedade institucional do endereço.

---

## 3. Condição atual dos ambientes

| Ambiente | Estado atual | Ação necessária |
|---|---|---|
| GitHub | conectado e operacional | manter fluxo por PR |
| GitHub Actions | implantação iniciada | validar primeiro workflow |
| Vercel | conexão ainda precisa ser conferida | vincular repositório e variáveis |
| Render | endereço existente, tela atual em branco | revisar deploy, logs, variáveis e publicação |
| Supabase | aplicação conectada, administração não auditada | revisar trigger, RLS e estrutura |
| UOL Host | domínio oficial ainda não contratado | pesquisar, contratar e configurar no momento protocolar |

---

## 4. Cronograma protocolar

Os prazos abaixo representam janelas técnicas estimadas e dependem da homologação de cada etapa. O avanço não ocorrerá enquanto existir falha técnica ou reprovação visual na fase anterior.

### Etapa 00 — Governança, CI e ambientes

**Janela estimada:** 2 a 4 dias úteis  
**Estado:** em execução

Entregas:

- Plano Mestre do AGP;
- cronograma executivo;
- GitHub Actions para `npm ci` e `npm run build`;
- configuração de SPA para Vercel;
- configuração de SPA para Render;
- inventário das variáveis de ambiente;
- identificação da causa da tela branca atual;
- ativação de previews;
- definição do registro de homologação.

Portão de saída:

- PR aprovado tecnicamente;
- build verde;
- preview Vercel carregando;
- Render carregando;
- Home, Divisão e Login visíveis;
- homologação visual do usuário.

### Etapa 01 — Autenticação e quatro perfis

**Janela estimada:** 4 a 7 dias úteis  
**Dependência:** Etapa 00 homologada

Entregas:

- padronização de Atleta, Comissão Técnica, Clube e Master;
- login correto por divisão;
- redirecionamentos seguros;
- sessão persistente;
- logout;
- recuperação de senha;
- bloqueio de acesso cruzado;
- revisão do trigger de perfil;
- revisão das políticas RLS;
- eliminação de fluxos paralelos de autenticação;
- consolidação do cliente Supabase.

Portão de saída:

- quatro perfis testados;
- acessos autorizados e negados comprovados;
- Vercel e Render sincronizados;
- homologação visual do usuário.

### Etapa 02 — Banco, migrations e cadastro completo do atleta

**Janela estimada:** 8 a 15 dias úteis  
**Dependência:** Etapa 01 homologada

Entregas:

- inventário completo do banco;
- migrations versionadas;
- relacionamentos e integridade;
- cadastro principal;
- dados biológicos;
- corporais;
- fisiológicos;
- biomecânicos;
- psicológicos;
- contexto social;
- nutrição;
- lesões;
- plano de ação;
- competições;
- persistência e edição;
- histórico de alterações.

Portão de saída:

- atleta completo criado e reaberto;
- dados persistentes;
- segurança validada;
- homologação visual do usuário.

### Etapa 03 — Dashboard do Atleta

**Janela estimada:** 6 a 10 dias úteis

Entregas:

- resumo individual;
- completude cadastral;
- indicadores principais;
- evolução;
- timeline;
- competições;
- plano de ação;
- alertas adequados ao perfil do atleta;
- responsividade.

Observação obrigatória:

- risco de lesão não será apresentado diretamente ao atleta de forma que gere impacto emocional indevido; a exposição dependerá do perfil e da governança clínica/técnica.

Portão de saída:

- dashboard funcional em Vercel e Render;
- visualização desktop e móvel;
- homologação visual do usuário.

### Etapa 04 — Comissão Técnica

**Janela estimada:** 7 a 12 dias úteis

Entregas:

- dashboard da comissão;
- atletas vinculados;
- avaliações;
- filtros;
- planos e intervenções;
- indicadores técnicos;
- alertas restritos;
- controle por vínculo.

Portão de saída:

- fluxo de comissão validado;
- isolamento de atletas comprovado;
- homologação visual do usuário.

### Etapa 05 — Clubes e Associações

**Janela estimada:** 7 a 12 dias úteis

Entregas:

- dashboard institucional;
- cadastro do clube;
- equipes e categorias;
- vínculos;
- indicadores agregados;
- calendário;
- relatórios institucionais;
- isolamento organizacional.

Portão de saída:

- clube opera somente seus dados;
- Vercel e Render validados;
- homologação visual do usuário.

### Etapa 06 — Master e administração

**Janela estimada:** 6 a 10 dias úteis

Entregas:

- gestão de usuários;
- papéis e permissões;
- clubes, esportes e modalidades;
- configurações;
- auditoria;
- logs administrativos;
- bloqueios e aprovações.

Portão de saída:

- administração controlada e auditável;
- homologação visual do usuário.

### Etapa 07 — Indicadores e score esportivo

**Janela estimada:** 10 a 20 dias úteis

Entregas:

- catálogo de indicadores;
- fórmulas;
- pesos;
- normalizações;
- scores dimensionais;
- score geral;
- histórico;
- explicabilidade;
- validação especializada.

Portão de saída:

- resultados reproduzíveis;
- fórmulas documentadas;
- homologação conceitual e visual.

### Etapa 08 — Relatórios, exportações e comparativos

**Janela estimada:** 8 a 15 dias úteis

Entregas:

- relatórios individuais;
- técnicos;
- institucionais;
- exportação PDF;
- comparações autorizadas;
- auditoria de geração.

Portão de saída:

- relatórios conferidos;
- homologação visual do usuário.

### Etapa 09 — BI e Analytics

**Janela estimada:** 10 a 18 dias úteis

Entregas:

- painéis analíticos;
- tendências;
- segmentações;
- benchmarks;
- mapas de risco;
- filtros e exploração.

Portão de saída:

- resultados consistentes entre consultas;
- homologação visual do usuário.

### Etapa 10 — Recomendações e Inteligência Artificial

**Janela estimada:** 15 a 30 dias úteis

Entregas:

- casos de uso priorizados;
- recomendações explicáveis;
- projeções;
- sinalização de potencial;
- avaliação de risco;
- revisão humana;
- versionamento e auditoria de modelos;
- monitoramento de viés e qualidade.

Portão de saída:

- aprovação técnica e especializada;
- homologação visual e conceitual do usuário.

### Etapa 11 — Agenda, calendário e notificações

**Janela estimada:** 7 a 12 dias úteis

Entregas:

- agenda;
- calendário competitivo;
- eventos;
- notificações;
- preferências;
- alertas e pendências.

Portão de saída:

- entrega e leitura de alertas comprovadas;
- homologação visual do usuário.

### Etapa 12 — Segurança, LGPD, qualidade e observabilidade

**Janela estimada:** 10 a 20 dias úteis

Entregas:

- revisão final de RLS;
- proteção de segredos;
- consentimentos;
- tratamento de dados de menores;
- retenção e exclusão;
- testes unitários, integração e E2E;
- acessibilidade;
- monitoramento;
- backup e recuperação;
- plano de incidentes.

Portão de saída:

- ausência de falhas críticas;
- evidências de isolamento e auditoria;
- homologação final técnica.

### Etapa 13 — Domínio oficial UOL Host

**Janela de contratação:** durante as Etapas 01 a 03  
**Janela de ativação:** após estabilidade técnica mínima da plataforma

Procedimento:

1. definir e verificar o nome oficial do domínio;
2. confirmar titularidade e dados cadastrais;
3. contratar o domínio na UOL Host;
4. manter o domínio sem apontamento prematuro para produção instável;
5. definir ambiente definitivo principal;
6. configurar DNS;
7. configurar domínio personalizado na Vercel e/ou Render;
8. emitir e validar SSL;
9. configurar redirecionamentos `www` e domínio raiz;
10. atualizar URLs autorizadas do Supabase Auth;
11. validar login, logout e recuperação de senha pelo domínio;
12. acompanhar propagação de DNS;
13. realizar homologação visual no endereço oficial.

O pagamento e a confirmação da contratação do domínio exigem ação do titular da conta UOL Host. O trabalho técnico de preparação, apontamento e validação será executado dentro da etapa correspondente.

### Etapa 14 — Lançamento e entrega final

**Janela estimada:** 5 a 10 dias úteis

Entregas:

- produção definitiva;
- domínio oficial;
- SSL;
- documentação técnica;
- manual administrativo;
- manual dos perfis;
- dados iniciais;
- plano de rollback;
- aceite final;
- acompanhamento pós-lançamento.

Portão de saída:

- jornada completa dos quatro perfis;
- domínio oficial operando;
- aceite final do usuário.

---

## 5. Estimativa global

Considerando execução sequencial, correções, validações e homologações, a implantação completa possui uma janela preliminar de aproximadamente **16 a 30 semanas úteis**.

Essa estimativa não representa promessa rígida de calendário. Ela depende de:

- complexidade real do banco existente;
- disponibilidade das regras científicas dos scores;
- acessos ao Supabase, Vercel, Render e UOL Host;
- tempo de resposta das homologações;
- necessidade de correções encontradas nos testes;
- definições legais e de privacidade para dados sensíveis e menores.

---

## 6. Registro obrigatório por entrega

Cada PR deverá registrar:

- fase e objetivo;
- arquivos alterados;
- migrations aplicadas;
- testes executados;
- resultado do GitHub Actions;
- URL da Vercel;
- URL do Render;
- evidências visuais;
- resultado da homologação;
- autorização para continuidade.

---

## 7. Próxima execução imediata

A execução atual permanece na Etapa 00 e na primeira parte da Etapa 01:

1. concluir validação automática do PR nº 1;
2. verificar o resultado do build;
3. corrigir qualquer falha;
4. revisar a tela branca do Render;
5. confirmar ou criar integração Vercel;
6. publicar a branch para preview;
7. validar Home, Divisão, Login e rotas;
8. apresentar as URLs ao usuário;
9. homologar visualmente;
10. integrar na `main`;
11. iniciar a consolidação completa da autenticação.
