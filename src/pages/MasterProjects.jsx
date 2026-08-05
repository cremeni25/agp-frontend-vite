import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listInstitutions } from "../services/institutionManagement";
import { createProject, deleteProject, listProjects, updateProject } from "../services/projectManagement";
import "../styles/dashboard-master.css";

const EMPTY = {
  instituicao_id: "",
  nome: "",
  objetivo: "",
  metodologia: "",
  diretrizes: "",
  localidade: "",
  data_inicio: "",
  data_fim: "",
  status: "preparacao",
  versao_motor: "agp-core-v2"
};

const STATUS_LABEL = {
  preparacao: "Preparação",
  homologacao: "Homologação",
  em_campo: "Em campo",
  concluido: "Concluído",
  suspenso: "Suspenso"
};

export default function MasterProjects() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sortedInstitutions = useMemo(() => [...institutions].sort((a, b) => a.nome.localeCompare(b.nome)), [institutions]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [institutionRows, projectRows] = await Promise.all([listInstitutions(), listProjects()]);
      setInstitutions(institutionRows || []);
      setProjects(projectRows || []);
      setForm((current) => ({ ...current, instituicao_id: current.instituicao_id || institutionRows?.[0]?.id || "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY, instituicao_id: sortedInstitutions[0]?.id || "" });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const payload = {
      ...form,
      metodologia: form.metodologia || null,
      diretrizes: form.diretrizes || null,
      localidade: form.localidade || null,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null
    };
    try {
      if (editingId) {
        await updateProject(editingId, payload);
        setMessage(`Projeto ${form.nome} atualizado com sucesso.`);
      } else {
        await createProject(payload);
        setMessage(`Projeto ${form.nome} criado com sucesso.`);
      }
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(project) {
    setEditingId(project.id);
    setForm({
      instituicao_id: project.instituicao_id || "",
      nome: project.nome || "",
      objetivo: project.objetivo || "",
      metodologia: project.metodologia || "",
      diretrizes: project.diretrizes || "",
      localidade: project.localidade || "",
      data_inicio: project.data_inicio || "",
      data_fim: project.data_fim || "",
      status: project.status || "preparacao",
      versao_motor: project.versao_motor || "agp-core-v2"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(project) {
    if (!window.confirm(`Excluir o projeto ${project.nome}?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteProject(project.id);
      setMessage(`Projeto ${project.nome} excluído.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Núcleo Administrativo</span><h1>Projetos</h1><p>Projetos operacionais vinculados às instituições homologadas.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master/administracao")}>Voltar</button></header>
    {message && <div className="master-feedback success">{message}</div>}
    {error && <div className="master-feedback error">{error}</div>}
    <section className="dashboard-section master-split">
      <form className="master-panel" onSubmit={submit}>
        <span className="master-eyebrow">Cadastro mestre</span><h2>{editingId ? "Editar projeto" : "Novo projeto"}</h2>
        <label>Instituição<select name="instituicao_id" value={form.instituicao_id} onChange={change} required>{sortedInstitutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label>Nome<input name="nome" value={form.nome} onChange={change} minLength="2" required /></label>
        <label>Objetivo<textarea name="objetivo" value={form.objetivo} onChange={change} rows="3" required /></label>
        <label>Metodologia<textarea name="metodologia" value={form.metodologia} onChange={change} rows="2" /></label>
        <label>Diretrizes<textarea name="diretrizes" value={form.diretrizes} onChange={change} rows="2" /></label>
        <label>Localidade<input name="localidade" value={form.localidade} onChange={change} placeholder="Cidade / Estado" /></label>
        <div className="master-form-grid"><label>Início<input type="date" name="data_inicio" value={form.data_inicio} onChange={change} /></label><label>Fim<input type="date" name="data_fim" value={form.data_fim} onChange={change} /></label></div>
        <label>Status<select name="status" value={form.status} onChange={change}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Versão do motor<input name="versao_motor" value={form.versao_motor} onChange={change} required /></label>
        <button className="master-button" disabled={saving || !institutions.length}>{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar projeto"}</button>
        {editingId && <button type="button" className="master-button secondary" onClick={reset}>Cancelar edição</button>}
      </form>
      <div className="master-panel"><div className="master-panel-title"><div><span className="master-eyebrow">Base operacional</span><h2>Projetos cadastrados</h2></div><strong>{projects.length}</strong></div>
        {loading ? <p>Carregando...</p> : projects.length === 0 ? <p>Nenhum projeto cadastrado.</p> : projects.map((project) => <article className="master-list-row" key={project.id}><div><strong>{project.nome}</strong><span>{project.instituicao?.nome || "Instituição não identificada"} · {STATUS_LABEL[project.status] || project.status}</span><small>{project.objetivo}</small></div><div className="master-row-actions"><button className="master-button" onClick={() => edit(project)}>Editar</button><button className="master-button" onClick={() => remove(project)}>Excluir</button></div></article>)}
      </div>
    </section>
  </div></main>;
}
