import { useMemo, useState } from "react";

const MOMENTS = [
  { label: "Avaliação inicial", fisico: 66, fisiologico: 70, tecnico: 78, mental: 61, recuperacao: 54, contextual: 72 },
  { label: "Semana 2", fisico: 69, fisiologico: 73, tecnico: 79, mental: 64, recuperacao: 58, contextual: 73 },
  { label: "Semana 4", fisico: 72, fisiologico: 76, tecnico: 82, mental: 68, recuperacao: 63, contextual: 75 },
  { label: "Semana 6", fisico: 75, fisiologico: 79, tecnico: 84, mental: 72, recuperacao: 69, contextual: 77 }
];

const WEIGHTS = { fisiologico: 0.25, tecnico: 0.2, recuperacao: 0.2, mental: 0.15, fisico: 0.1, contextual: 0.1 };

function calculateScore(moment) {
  return Object.entries(WEIGHTS).reduce((total, [key, weight]) => total + moment[key] * weight, 0).toFixed(1);
}

function classify(score) {
  if (score < 40) return "Crítico";
  if (score < 60) return "Desenvolvimento";
  if (score < 75) return "Competitivo";
  if (score < 90) return "Alto Rendimento";
  return "Elite Mundial";
}

export default function AgpOperationalDemo() {
  const [step, setStep] = useState(0);
  const current = MOMENTS[step];
  const score = Number(calculateScore(current));
  const previousScore = step > 0 ? Number(calculateScore(MOMENTS[step - 1])) : null;
  const delta = previousScore === null ? 0 : (score - previousScore).toFixed(1);

  const weakest = useMemo(() => {
    return Object.entries(current)
      .filter(([key]) => !["label"].includes(key))
      .sort((a, b) => a[1] - b[1])[0];
  }, [current]);

  const recommendation = {
    recuperacao: "Reduzir carga acumulada por 48 horas, priorizar sono e reavaliar percepção de fadiga antes do próximo estímulo intenso.",
    mental: "Aplicar rotina breve de preparação psicológica e registrar confiança, foco e percepção de pressão antes e depois do treino.",
    fisico: "Recalibrar força e mobilidade conforme o gesto esportivo predominante e repetir os testes de controle na próxima semana.",
    fisiologico: "Revisar resposta cardiovascular, esforço percebido e recuperação entre séries antes de aumentar volume.",
    tecnico: "Priorizar correção do fundamento com maior variabilidade e comparar execução sob fadiga e em condição controlada.",
    contextual: "Revisar rotina, ambiente, aderência e fatores externos que estejam afetando consistência e disponibilidade."
  }[weakest[0]];

  return (
    <section className="master-panel agp-demo-panel">
      <div className="master-section-heading">
        <div>
          <span className="master-eyebrow">AGP em funcionamento</span>
          <h2>Homologação guiada com atleta demonstrativo</h2>
          <p>Veja o sistema transformar dados multidimensionais em score, tendência, diagnóstico e decisão técnica.</p>
        </div>
        <strong>{step + 1}/{MOMENTS.length}</strong>
      </div>

      <div className="master-action-grid">
        <article className="master-action-card">
          <span className="master-eyebrow">Atleta</span>
          <strong>Marina Costa · Natação</strong>
          <span>16 anos · nível competitivo · 100 m livre</span>
        </article>
        <article className="master-action-card">
          <span className="master-eyebrow">Score AGP</span>
          <strong>{score}</strong>
          <span>{classify(score)} {previousScore !== null ? `· ${delta >= 0 ? "+" : ""}${delta} desde a última leitura` : "· linha de base"}</span>
        </article>
        <article className="master-action-card">
          <span className="master-eyebrow">Prioridade atual</span>
          <strong>{weakest[0]}</strong>
          <span>Dimensão com menor resultado: {weakest[1]}</span>
        </article>
      </div>

      <div className="master-content-grid">
        <article className="master-panel">
          <span className="master-eyebrow">Leitura multidimensional</span>
          <h3>{current.label}</h3>
          <ul className="master-activity-list">
            {Object.entries(current).filter(([key]) => key !== "label").map(([key, value]) => (
              <li key={key}><div><strong>{key}</strong><span>Contribuição ponderada ao desempenho global</span></div><b>{value}</b></li>
            ))}
          </ul>
        </article>

        <article className="master-panel">
          <span className="master-eyebrow">Devolutiva AGP</span>
          <h3>Decisão recomendada</h3>
          <p>{recommendation}</p>
          <div className="master-success">Tendência geral: {step === 0 ? "linha de base criada" : "evolução positiva e sustentada"}.</div>
          <p><strong>Próxima verificação:</strong> repetir a dimensão prioritária após o próximo microciclo e comparar resposta, aderência e efeito da intervenção.</p>
        </article>
      </div>

      <div className="master-toolbar">
        <button className="master-button secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Momento anterior</button>
        <button className="master-button" disabled={step === MOMENTS.length - 1} onClick={() => setStep((value) => value + 1)}>Avançar evolução</button>
      </div>
    </section>
  );
}
