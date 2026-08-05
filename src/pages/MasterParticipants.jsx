import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { createInstitutionParticipant, listProjectParticipants } from "../services/participantOnboarding";
import "../styles/dashboard-master.css";

const EMPTY_FORM = {
  nome: "",
  data_nascimento: "",
  email_contato: "",
  telefone_contato: "",
  papel: "atleta",
  instituicao_id: "",
  projeto_id: "",
  modalidade: "",
  prova_posicao: "",
  categoria: "",
  nivel: "",
  tecnico_responsavel_pessoa_id: ""
};

export default function MasterParticipants() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBase() {
    setLoading(true);
    setError("");
    const [institutionResult, projectResult] = await Promise.all([
      supabase.from("agp_instituicoes").select("id,nome,slug,status").order("nome"),
      supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,objetivo,status").order("created_at")
    ]);
    const firstError = institutionResult.error || projectResult.error;
    if (firstError) setError(`Falha ao carregar estrutura institucional: ${firstError.message}`);
    setInstitutions(institutionResult.data || []);
    setProjects(projectResult.data || []);
    setLoading(false);
  }

  useEffect(() => { loadBase(); }, []);

  const availableProjects = useMemo(
    () => projects.filter((item) => !form.instituicao_id || item.instituicao_id === form.instituicao_id),
    [projects, form.instituicao_id]
  );

  const technicians = useMemo(
    () => participants.filter((item) => ["tecnico", "treinador"].includes(item.funcao_no_projeto) && item.ativo),
    [participants]
  );

  async function loadParticipants(projectId) {
    if (!projectId) { setParticipants([]); return; }
    try {
      setParticipants(await listProjectParticipants(projectId));
    } catch (requestError) {
      setParticipants([]);
      setError(`Falha ao carregar participantes: ${requestError.message}`);
    }
  }

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "instituicao_id") {
        next.projeto_id = "";
        next.tecnico_responsavel_pessoa_id = "";
        setParticipants([]);
      }
      return next;
    });
  }

  async function handleProjectChange(projectId) {
    updateField("projeto_id", projectId);
    await loadParticipants(projectId);
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.instituicao_id) { setError("Selecione a instituição."); return; }
    if (form.papel === "atleta" && !form.modalidade.trim()) { setError("Informe a modalidade do atleta."); return; }

    setWorking(true); setMessage(""); setError("");
    const payload = {
      nome: form.nome.trim(),
      data_nascimento: form.data_nascimento || null,
      email_contato: form.email_contato || null,
      telefone_contato: form.telefone_contato || null,
      papel: form.papel,
      projeto_id: form.projeto_id || null,
      tecnico_responsavel_pessoa_id: form.papel === "atleta" ? form.tecnico_responsavel_pessoa_id || null : null,
      escopo: {},
      acesso: form.email_contato ? { email_acesso: form.email_contato } : null,
      perfil_esportivo: form.papel === "atleta" ? {
        modalidade: form.modalidade.trim(),
        prova_posicao: form.prova_posicao || null,
        categoria: form.categoria || null,
        nivel: form.nivel || null,
        dados_complementares: {}
      } : null
    };

    try {
      const result = await createInstitutionParticipant(form.instituicao_id, payload);
      setMessage(`Participante criado. Estado: ${result.status_onboarding}.`);
      const retained = { instituicao_id: form.instituicao_id, projeto_id: form.projeto_id };
      setForm({ ...EMPTY_FORM, ...retained });
      await loadParticipants(retained.projeto_id);
    } catch (requestError) {
      setError(`Falha no onboarding: ${requestError.message}`);
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="dashboard-master"><div className="dashboard-overlay master-page">
      <header className="dashboard-header master-header">
        <div><span className="master-eyebrow">Governança institucional</span><h1>Central de Participantes</h1><p>Identidade, papel, projeto, acesso e situação de onboarding em um único fluxo auditável.</p></div>
        <button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button>
      </header>

      {message && <div className="master-success">{message}</div>}
      {error && <div className="master-error" role="alert">{error}</div>}

      <section className="master-content-grid">
        <form className="master-panel" onSubmit={submit}>
          <div className="master-section-heading"><div><span className="master-eyebrow">Novo cadastro</span><h2>Onboarding institucional</h2></div></div>
          <input className="master-input" required minLength="2" placeholder="Nome completo" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} />
          <div className="master-toolbar">
            <input className="master-input" type="date" value={form.data_nascimento} onChange={(e) => updateField("data_nascimento", e.target.value)} />
            <select className="master-select" value={form.papel} onChange={(e) => updateField("papel", e.target.value)}>
              <option value="atleta">Atleta</option><option value="tecnico">Técnico</option><option value="treinador">Treinador</option><option value="preparador_fisico">Preparador físico</option><option value="medico">Médico</option><option value="fisioterapeuta">Fisioterapeuta</option><option value="psicologo">Psicólogo</option><option value="nutricionista">Nutricionista</option><option value="gestor">Gestor</option><option value="analista">Analista</option><option value="responsavel_legal">Responsável legal</option>
            </select>
          </div>
          <input className="master-input" type="email" placeholder="E-mail de contato e futuro acesso" value={form.email_contato} onChange={(e) => updateField("email_contato", e.target.value)} />
          <input className="master-input" placeholder="Telefone" value={form.telefone_contato} onChange={(e) => updateField("telefone_contato", e.target.value)} />
          <select className="master-select" required value={form.instituicao_id} onChange={(e) => updateField("instituicao_id", e.target.value)}><option value="">Selecionar instituição</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>
          <select className="master-select" value={form.projeto_id} onChange={(e) => handleProjectChange(e.target.value)}><option value="">Sem projeto por enquanto</option>{availableProjects.map((item) => <option key={item.id} value={item.id}>{item.nome || item.objetivo || item.id}</option>)}</select>

          {form.papel === "atleta" && <>
            <input className="master-input" required placeholder="Modalidade" value={form.modalidade} onChange={(e) => updateField("modalidade", e.target.value)} />
            <div className="master-toolbar"><input className="master-input" placeholder="Prova ou posição" value={form.prova_posicao} onChange={(e) => updateField("prova_posicao", e.target.value)} /><input className="master-input" placeholder="Categoria" value={form.categoria} onChange={(e) => updateField("categoria", e.target.value)} /></div>
            <input className="master-input" placeholder="Nível esportivo" value={form.nivel} onChange={(e) => updateField("nivel", e.target.value)} />
            <select className="master-select" value={form.tecnico_responsavel_pessoa_id} onChange={(e) => updateField("tecnico_responsavel_pessoa_id", e.target.value)}><option value="">Técnico responsável ainda não definido</option>{technicians.map((item) => <option key={item.pessoa_id} value={item.pessoa_id}>{item.nome}</option>)}</select>
          </>}

          <button className="master-button" disabled={working || loading}>{working ? "Registrando..." : "Cadastrar participante"}</button>
        </form>

        <article className="master-panel">
          <div className="master-section-heading"><div><span className="master-eyebrow">Projeto selecionado</span><h2>Participantes e pendências</h2></div><strong>{participants.length}</strong></div>
          {!form.projeto_id ? <div className="master-empty">Selecione um projeto para consultar sua composição.</div> : participants.length === 0 ? <div className="master-empty">Nenhum participante canônico registrado neste projeto.</div> : <ul className="master-activity-list">{participants.map((item) => <li key={item.participante_id}><div><strong>{item.nome}</strong><span>{item.funcao_no_projeto} · {item.status_calculado}</span></div><b>{item.ativo ? "Ativo" : "Inativo"}</b></li>)}</ul>}
        </article>
      </section>
    </div></main>
  );
}
