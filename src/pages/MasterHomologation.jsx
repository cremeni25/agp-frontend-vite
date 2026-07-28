import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

const ENVIRONMENTS = [
  {
    slug: "agp-homologacao-master",
    nome: "AGP Homologação Master",
    localidade: "Ambiente interno",
    projeto: "Homologação integral dos módulos",
    objetivo: "Validar o fluxo completo do AGP antes da liberação aos avaliadores."
  },
  {
    slug: "agp-piloto-tecnico-a",
    nome: "Piloto Técnico A",
    localidade: "Localidade a definir",
    projeto: "Avaliação independente A",
    objetivo: "Aplicar metodologia, diretrizes e atletas escolhidos pelo Técnico A."
  },
  {
    slug: "agp-piloto-tecnico-b",
    nome: "Piloto Técnico B",
    localidade: "Localidade a definir",
    projeto: "Avaliação independente B",
    objetivo: "Aplicar metodologia, diretrizes e atletas escolhidos pelo Técnico B."
  }
];

const MODULES = [
  "Estrutura institucional",
  "Técnicos e permissões",
  "Cadastro e vínculo de atletas",
  "Avaliação multidimensional inicial",
  "Registro diário e carga de treinamento",
  "Motor de score AGP",
  "Histórico longitudinal",
  "Tendências e intervenções",
  "Relatório individual",
  "Comparativo final dos pilotos"
];

export default function MasterHomologation() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const [institutionResult, projectResult] = await Promise.all([
      supabase.from("agp_instituicoes").select("*").order("created_at"),
      supabase.from("agp_projetos_validacao").select("*").order("created_at")
    ]);

    if (institutionResult.error) {
      setError("Núcleo de homologação ainda não foi aplicado ao Supabase.");
      setInstitutions([]);
      setProjects([]);
    } else {
      setInstitutions(institutionResult.data || []);
      setProjects(projectResult.data || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function initialize() {
    setWorking(true);
    setMessage("");
    setError("");

    for (const environment of ENVIRONMENTS) {
      const { data: institution, error: institutionError } = await supabase
        .from("agp_instituicoes")
        .upsert({
          nome: environment.nome,
          slug: environment.slug,
          tipo: "homologacao",
          localidade: environment.localidade,
          status: "ativo"
        }, { onConflict: "slug" })
        .select("*")
        .single();

      if (institutionError) {
        setError(`Falha ao criar ${environment.nome}: ${institutionError.message}`);
        setWorking(false);
        return;
      }

      const existing = projects.find((project) => project.instituicao_id === institution.id);
      if (!existing) {
        const { error: projectError } = await supabase.from("agp_projetos_validacao").insert({
          instituicao_id: institution.id,
          nome: environment.projeto,
          objetivo: environment.objetivo,
          localidade: environment.localidade,
          status: environment.slug.includes("master") ? "homologacao" : "preparacao",
          versao_motor: "agp-core-v2"
        });
        if (projectError) {
          setError(`Falha ao criar projeto de ${environment.nome}: ${projectError.message}`);
          setWorking(false);
          return;
        }
      }
    }

    setMessage("Os três ambientes de validação foram inicializados.");
    await load();
    setWorking(false);
  }

  const environments = useMemo(() => ENVIRONMENTS.map((definition) => {
    const institution = institutions.find((item) => item.slug === definition.slug);
    const project = projects.find((item) => item.instituicao_id === institution?.id);
    return { ...definition, institution, project };
  }), [institutions, projects]);

  return (
    <main className="dashboard-master">
      <div className="dashboard-overlay master-page">
        <header className="dashboard-header master-header">
          <div>
            <span className="master-eyebrow">Validação controlada</span>
            <h1>Centro de homologação AGP</h1>
            <p>Um ambiente interno e dois pilotos técnicos independentes.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button>
            <button className="master-button" disabled={working} onClick={initialize}>
              {working ? "Inicializando..." : "Inicializar ambientes"}
            </button>
          </div>
        </header>

        {message && <div className="master-success">{message}</div>}
        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="master-action-grid">
          {environments.map((environment) => (
            <article className="master-panel" key={environment.slug}>
              <span className="master-eyebrow">{environment.localidade}</span>
              <h2>{environment.nome}</h2>
              <p>{environment.objetivo}</p>
              <div className="master-section-heading">
                <span className={`master-status ${environment.institution ? "ativo" : "inativo"}`}>
                  {loading ? "Verificando" : environment.institution ? "Ambiente criado" : "Pendente"}
                </span>
                <strong>{environment.project?.status || "—"}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="master-panel">
          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Roteiro de validação</span>
              <h2>Módulos que serão homologados</h2>
            </div>
            <strong>{MODULES.length}</strong>
          </div>
          <ol className="master-activity-list">
            {MODULES.map((module, index) => (
              <li key={module}>
                <div><strong>{String(index + 1).padStart(2, "0")}</strong><span>{module}</span></div>
                <b>Pendente</b>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
