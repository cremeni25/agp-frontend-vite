import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

const DEFINITIONS = [
  {
    slug: "agp-homologacao-master",
    nome: "AGP Homologação Master",
    localidade: "Ambiente interno",
    projeto: "Homologação integral dos módulos",
    objetivo: "Validar o fluxo completo do AGP antes da liberação aos avaliadores.",
    status: "homologacao"
  },
  {
    slug: "agp-piloto-tecnico-a",
    nome: "Piloto Técnico A",
    localidade: "Localidade a definir",
    projeto: "Avaliação independente A",
    objetivo: "Aplicar metodologia, diretrizes e atletas escolhidos pelo Técnico A.",
    status: "preparacao"
  },
  {
    slug: "agp-piloto-tecnico-b",
    nome: "Piloto Técnico B",
    localidade: "Localidade a definir",
    projeto: "Avaliação independente B",
    objetivo: "Aplicar metodologia, diretrizes e atletas escolhidos pelo Técnico B.",
    status: "preparacao"
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

export default function MasterHomologationOperational() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [openingSlug, setOpeningSlug] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    const [institutionResult, projectResult, memberResult, athleteResult] = await Promise.all([
      supabase.from("agp_instituicoes").select("*").order("created_at"),
      supabase.from("agp_projetos_validacao").select("*").order("created_at"),
      supabase.from("agp_membros_instituicao").select("*").order("created_at"),
      supabase.from("agp_atletas_projeto").select("*").order("created_at")
    ]);

    const firstError = institutionResult.error || projectResult.error || memberResult.error || athleteResult.error;

    if (firstError) {
      setError(`Estrutura de homologação indisponível: ${firstError.message}`);
      setInstitutions([]);
      setProjects([]);
      setMembers([]);
      setAthletes([]);
    } else {
      setInstitutions(institutionResult.data || []);
      setProjects(projectResult.data || []);
      setMembers(memberResult.data || []);
      setAthletes(athleteResult.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const environments = useMemo(
    () => DEFINITIONS.map((definition) => {
      const institution = institutions.find((item) => item.slug === definition.slug);
      const project = projects.find((item) => item.instituicao_id === institution?.id);
      const environmentMembers = members.filter((item) => item.instituicao_id === institution?.id);
      const environmentAthletes = athletes.filter((item) => item.projeto_id === project?.id);

      return {
        ...definition,
        institution,
        project,
        members: environmentMembers,
        athletes: environmentAthletes
      };
    }),
    [institutions, projects, members, athletes]
  );

  async function ensureEnvironment(definition) {
    const { data: institution, error: institutionError } = await supabase
      .from("agp_instituicoes")
      .upsert(
        {
          nome: definition.nome,
          slug: definition.slug,
          tipo: "homologacao",
          localidade: definition.localidade,
          status: "ativo"
        },
        { onConflict: "slug" }
      )
      .select("*")
      .single();

    if (institutionError) {
      throw new Error(`Falha ao criar ${definition.nome}: ${institutionError.message}`);
    }

    const { data: existing, error: existingError } = await supabase
      .from("agp_projetos_validacao")
      .select("id")
      .eq("instituicao_id", institution.id)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Falha ao verificar projeto: ${existingError.message}`);
    }

    if (!existing) {
      const { error: projectError } = await supabase
        .from("agp_projetos_validacao")
        .insert({
          instituicao_id: institution.id,
          nome: definition.projeto,
          objetivo: definition.objetivo,
          localidade: definition.localidade,
          status: definition.status,
          versao_motor: "agp-core-v2"
        });

      if (projectError) {
        throw new Error(`Falha ao criar projeto: ${projectError.message}`);
      }
    }

    return institution;
  }

  async function initialize() {
    setWorking(true);
    setError("");
    setMessage("");

    try {
      for (const definition of DEFINITIONS) {
        await ensureEnvironment(definition);
      }

      setMessage("Ambientes de homologação inicializados.");
      await load();
    } catch (initializationError) {
      setError(initializationError.message);
    } finally {
      setWorking(false);
    }
  }

  async function openEnvironment(environment) {
    setOpeningSlug(environment.slug);
    setError("");
    setMessage("");

    try {
      if (!environment.institution || !environment.project) {
        await ensureEnvironment(environment);
        await load();
      }

      navigate(`/master/homologacao/${environment.slug}`);
    } catch (openingError) {
      setError(openingError.message);
    } finally {
      setOpeningSlug("");
    }
  }

  return (
    <main className="dashboard-master">
      <div className="dashboard-overlay master-page">
        <header className="dashboard-header master-header">
          <div>
            <span className="master-eyebrow">Validação controlada</span>
            <h1>Centro de homologação AGP</h1>
            <p>Operação interna e dois pilotos técnicos independentes.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button>
            <button className="master-button" disabled={working} onClick={initialize}>
              {working ? "Processando..." : "Inicializar ambientes"}
            </button>
          </div>
        </header>

        {message && <div className="master-success">{message}</div>}
        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="master-action-grid">
          {environments.map((environment) => {
            const technicians = environment.members.filter((member) => member.papel === "tecnico");
            const isReady = Boolean(environment.institution && environment.project);
            const isOpening = openingSlug === environment.slug;

            return (
              <article className="master-action-card" key={environment.slug}>
                <span className="master-eyebrow">{environment.localidade}</span>
                <strong>{environment.nome}</strong>
                <span>{environment.objetivo}</span>
                <div className="master-section-heading">
                  <span className={`master-status ${isReady ? "ativo" : "inativo"}`}>
                    {loading ? "Verificando" : isReady ? "Ambiente criado" : "Pendente"}
                  </span>
                  <b>{technicians.length} técnico(s) · {environment.athletes.length} atleta(s)</b>
                </div>
                <button
                  type="button"
                  className="master-button"
                  disabled={Boolean(openingSlug)}
                  onClick={() => openEnvironment(environment)}
                >
                  {isOpening ? "Preparando..." : isReady ? "Abrir ambiente" : "Preparar e abrir"}
                </button>
              </article>
            );
          })}
        </section>

        <section className="master-panel">
          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Roteiro</span>
              <h2>Módulos de homologação</h2>
            </div>
            <strong>{MODULES.length}</strong>
          </div>
          <ol className="master-activity-list">
            {MODULES.map((module, index) => (
              <li key={module}>
                <div>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <span>{module}</span>
                </div>
                <b>Pendente</b>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
