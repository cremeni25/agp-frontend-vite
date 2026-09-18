import { useNavigate } from "react-router-dom";
import SwimmingShell from "../components/SwimmingShell";

const JOURNEYS = [
  {
    role: "Atleta",
    purpose: "Entender o próprio dia, registrar percepção e acompanhar a própria evolução.",
    steps: [
      "Entrar no AGP",
      "Ver o que importa hoje",
      "Responder prontidão diária",
      "Consultar treinos e provas",
      "Acompanhar evolução",
      "Consultar histórico longitudinal"
    ],
    sees: "Seu próprio contexto, registros e evolução.",
    doesNot: "Não recebe diagnóstico automático nem score global."
  },
  {
    role: "Técnico / treinador",
    purpose: "Transformar contexto e evidência em decisão esportiva rastreável.",
    steps: [
      "Ver atletas do projeto",
      "Identificar contexto esportivo e status vinculado/federado",
      "Planejar treino para grupo ou atleta específico",
      "Aplicar ajustes individuais quando necessário",
      "Registrar a execução real de cada atleta",
      "Consultar prontidão, competição e histórico",
      "Selecionar evidências relevantes",
      "Registrar decisão e justificativa",
      "Criar intervenção",
      "Acompanhar resposta",
      "Consolidar aprendizado longitudinal"
    ],
    sees: "Atletas do projeto dentro do seu vínculo e contexto.",
    doesNot: "Não atua fora da própria competência e não substitui especialistas."
  },
  {
    role: "Especialista",
    purpose: "Contribuir com avaliação e decisão dentro da própria competência profissional.",
    steps: [
      "Entrar no projeto ao qual está vinculado",
      "Abrir o atleta",
      "Consultar evidências pertinentes ao seu escopo",
      "Registrar avaliação profissional",
      "Participar de decisões compatíveis com sua competência",
      "Acompanhar resposta quando aplicável"
    ],
    sees: "Somente o contexto permitido pelo vínculo, competência e credencial.",
    doesNot: "Não recebe autorização genérica por fazer parte da equipe."
  },
  {
    role: "Instituição / N1",
    purpose: "Acompanhar estrutura, vínculos e exceções sem substituir a operação esportiva.",
    steps: [
      "Ver atletas e equipe vinculados",
      "Acompanhar projetos ativos",
      "Identificar pendências de onboarding e vínculo",
      "Visualizar composição de atletas vinculados e federados",
      "Acompanhar continuidade institucional da homologação"
    ],
    sees: "Estrutura institucional e exceções administrativas.",
    doesNot: "Não toma decisão técnica, clínica ou esportiva em nome dos profissionais."
  }
];

export default function SwimmingHomologationJourney(){
  const navigate = useNavigate();
  return (
    <SwimmingShell
      eyebrow="Apresentação · AGP Swimming"
      title="Como cada pessoa vive o AGP"
      subtitle="Esta visão é explicativa. Ela mostra a jornada de cada perfil sem permitir que o Master aja em nome desses usuários."
      actions={[{label:"Voltar à governança",onClick:()=>navigate("/dashboard-master")}]}
    >
      <section className="swim-focus">
        <div>
          <span className="swim-eyebrow">Como apresentar o produto</span>
          <h2>Uma história única do atleta, com responsabilidades diferentes</h2>
          <p>O atleta registra o próprio contexto. O técnico transforma evidência em decisão. Especialistas contribuem dentro da competência. A instituição acompanha a estrutura. O Master preserva integridade, segurança e continuidade.</p>
        </div>
      </section>

      <section className="journey-grid">
        {JOURNEYS.map((item) => (
          <article className="journey-card" key={item.role}>
            <div className="journey-card-head">
              <span className="swim-panel-label">Jornada</span>
              <h2>{item.role}</h2>
              <p>{item.purpose}</p>
            </div>
            <ol className="journey-steps">
              {item.steps.map((step,index)=><li key={step}><span>{index+1}</span><strong>{step}</strong></li>)}
            </ol>
            <div className="journey-boundaries">
              <div><b>O que enxerga</b><p>{item.sees}</p></div>
              <div><b>Limite</b><p>{item.doesNot}</p></div>
            </div>
          </article>
        ))}
      </section>

      <section className="swim-panel">
        <span className="swim-panel-label">Narrativa recomendada</span>
        <h2>Apresentação em uma frase</h2>
        <p className="journey-quote">“O AGP acompanha o atleta longitudinalmente. Cada pessoa vê e faz apenas o que sua função exige, enquanto o sistema preserva contexto, evidência, segurança e continuidade.”</p>
      </section>

      <section className="swim-panel">
        <span className="swim-panel-label">Sequência de homologação N1</span>
        <h2>O que a N1 deverá percorrer</h2>
        <div className="journey-linear">
          <span>1. Criar vínculos reais</span>
          <span>2. Atleta usa o dia a dia</span>
          <span>3. Técnico e especialistas acompanham</span>
          <span>4. Instituição observa a operação</span>
          <span>5. N1 valida usabilidade e aderência</span>
          <span>6. Ajustes finais são registrados</span>
        </div>
      </section>
    </SwimmingShell>
  );
}
