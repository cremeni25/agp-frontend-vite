import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInstitution, deleteInstitution, listInstitutions, updateInstitution } from "../services/institutionManagement";
import "../styles/dashboard-master.css";

const EMPTY_FORM = { nome: "", slug: "", tipo: "instituto", localidade: "", status: "ativo" };

export default function MasterInstitutions() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setInstitutions(await listInstitutions()); }
    catch (requestError) { setError(`Falha ao carregar instituições: ${requestError.message}`); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function edit(item) {
    setEditingId(item.id);
    setForm({ nome: item.nome || "", slug: item.slug || "", tipo: item.tipo || "instituto", localidade: item.localidade || "", status: item.status || "ativo" });
    setMessage(""); setError("");
  }

  function cancelEdit() { setEditingId(""); setForm(EMPTY_FORM); }

  async function submit(event) {
    event.preventDefault(); setWorking(true); setMessage(""); setError("");
    const payload = { ...form, nome: form.nome.trim(), slug: form.slug.trim() || null, localidade: form.localidade.trim() || null };
    try {
      if (editingId) {
        await updateInstitution(editingId, payload);
        setMessage("Instituição atualizada com sucesso.");
      } else {
        const created = await createInstitution(payload);
        setMessage(`Instituição ${created.nome} criada com sucesso.`);
      }
      cancelEdit(); await load();
    } catch (requestError) { setError(`Falha ao salvar instituição: ${requestError.message}`); }
    finally { setWorking(false); }
  }

  async function remove(item) {
    const confirmed = window.confirm(`Excluir definitivamente a instituição ${item.nome}?`);
    if (!confirmed) return;
    setWorking(true); setMessage(""); setError("");
    try { await deleteInstitution(item.id); setMessage("Instituição excluída."); await load(); }
    catch (requestError) { setError(`Falha ao excluir instituição: ${requestError.message}`); }
    finally { setWorking(false); }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Administração</span><h1>Instituições</h1><p>Cadastro mestre das entidades que sustentam projetos, equipes e participantes.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master/administracao")}>Voltar</button></header>
    {message && <div className="master-success">{message}</div>}{error && <div className="master-error" role="alert">{error}</div>}

    <section className="master-content-grid">
      <form className="master-panel" onSubmit={submit}>
        <div className="master-section-heading"><div><span className="master-eyebrow">Cadastro mestre</span><h2>{editingId ? "Editar instituição" : "Nova instituição"}</h2></div></div>
        <label>Nome<input className="master-input" required minLength="2" value={form.nome} onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))} placeholder="Ex.: CREMENI" /></label>
        <label>Slug<input className="master-input" value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))} placeholder="Gerado automaticamente quando vazio" /></label>
        <label>Tipo<select className="master-select" value={form.tipo} onChange={(e) => setForm((current) => ({ ...current, tipo: e.target.value }))}><option value="instituto">Instituto</option><option value="clube">Clube</option><option value="associacao">Associação</option><option value="academia">Academia</option><option value="homologacao">Homologação</option></select></label>
        <label>Localidade<input className="master-input" value={form.localidade} onChange={(e) => setForm((current) => ({ ...current, localidade: e.target.value }))} placeholder="Cidade / Estado" /></label>
        <label>Status<select className="master-select" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}><option value="ativo">Ativo</option><option value="suspenso">Suspenso</option><option value="encerrado">Encerrado</option></select></label>
        <div className="master-toolbar"><button className="master-button" disabled={working}>{working ? "Salvando..." : editingId ? "Salvar alterações" : "Criar instituição"}</button>{editingId && <button type="button" className="master-button secondary" onClick={cancelEdit}>Cancelar</button>}</div>
      </form>

      <article className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Base institucional</span><h2>Instituições cadastradas</h2></div><strong>{institutions.length}</strong></div>
        {loading ? <div className="master-empty">Carregando instituições...</div> : institutions.length === 0 ? <div className="master-empty">Nenhuma instituição cadastrada.</div> : <ul className="master-activity-list">{institutions.map((item) => <li key={item.id}><div><strong>{item.nome}</strong><span>{item.tipo} · {item.localidade || "Localidade não informada"} · {item.status}</span></div><div className="master-toolbar"><button className="master-link-button" onClick={() => edit(item)}>Editar</button><button className="master-link-button" disabled={working} onClick={() => remove(item)}>Excluir</button></div></li>)}</ul>}
      </article>
    </section>
  </div></main>;
}
