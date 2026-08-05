import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listInstitutions } from "../services/institutionManagement";
import { createTechnicalMember, deleteTechnicalMember, listTechnicalTeam, listTechnicalUsers, updateTechnicalMember } from "../services/technicalTeamManagement";
import "../styles/dashboard-master.css";

const EMPTY = { instituicao_id: "", auth_id: "", nome: "", email: "", papel: "tecnico", acesso_total_tecnico: false, ativo: true };
const ROLE_LABEL = { admin_institucional: "Administrador institucional", tecnico: "Técnico", assistente: "Assistente", observador: "Observador" };

export default function MasterTechnicalTeam() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableUsers = useMemo(() => users.filter((user) => user.auth_id), [users]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [institutionRows, memberRows, userRows] = await Promise.all([
        listInstitutions(),
        listTechnicalTeam(),
        listTechnicalUsers()
      ]);
      setInstitutions(institutionRows || []);
      setMembers(memberRows || []);
      setUsers(userRows || []);
      setForm((current) => ({ ...current, instituicao_id: current.instituicao_id || institutionRows?.[0]?.id || "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function selectUser(event) {
    const authId = event.target.value;
    const user = availableUsers.find((item) => item.auth_id === authId);
    setForm((current) => ({ ...current, auth_id: authId, nome: user?.nome || "", email: user?.email || "" }));
  }

  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY, instituicao_id: institutions[0]?.id || "" });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      if (editingId) {
        const { auth_id, ...changes } = form;
        await updateTechnicalMember(editingId, changes);
        setMessage(`Membro ${form.nome} atualizado com sucesso.`);
      } else {
        await createTechnicalMember(form);
        setMessage(`Membro ${form.nome} vinculado com sucesso.`);
      }
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function edit(member) {
    setEditingId(member.id);
    setForm({
      instituicao_id: member.instituicao_id,
      auth_id: member.auth_id,
      nome: member.nome || "",
      email: member.email || "",
      papel: member.papel || "tecnico",
      acesso_total_tecnico: Boolean(member.acesso_total_tecnico),
      ativo: member.ativo !== false
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(member) {
    if (!window.confirm(`Excluir o vínculo técnico de ${member.nome}?`)) return;
    try {
      await deleteTechnicalMember(member.id);
      setMessage(`Vínculo de ${member.nome} excluído.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Núcleo Administrativo</span><h1>Equipe Técnica</h1><p>Profissionais vinculados às instituições do AGP.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master/administracao")}>Voltar</button></header>
    {message && <div className="master-feedback success">{message}</div>}
    {error && <div className="master-feedback error">{error}</div>}
    <section className="dashboard-section master-split">
      <form className="master-panel" onSubmit={submit}>
        <span className="master-eyebrow">Cadastro mestre</span><h2>{editingId ? "Editar profissional" : "Novo profissional"}</h2>
        <label>Instituição<select name="instituicao_id" value={form.instituicao_id} onChange={change} required>{institutions.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        {!editingId && <label>Usuário<select name="auth_id" value={form.auth_id} onChange={selectUser} required><option value="">Selecione um usuário</option>{availableUsers.map((user) => <option key={user.auth_id} value={user.auth_id}>{user.nome || user.email || user.auth_id}</option>)}</select></label>}
        {!loading && availableUsers.length === 0 && <p>Nenhum usuário autenticado disponível.</p>}
        <label>Nome<input name="nome" value={form.nome} onChange={change} required /></label>
        <label>E-mail<input type="email" name="email" value={form.email} onChange={change} placeholder="Opcional" /></label>
        <label>Papel<select name="papel" value={form.papel} onChange={change}>{Object.entries(ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="master-checkbox"><input type="checkbox" name="acesso_total_tecnico" checked={form.acesso_total_tecnico} onChange={change} />Acesso técnico total</label>
        <label className="master-checkbox"><input type="checkbox" name="ativo" checked={form.ativo} onChange={change} />Vínculo ativo</label>
        <div className="master-row-actions"><button className="master-button" disabled={saving || loading || !availableUsers.length}>{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Vincular profissional"}</button>{editingId && <button type="button" className="master-button secondary" onClick={reset}>Cancelar</button>}</div>
      </form>
      <div className="master-panel"><div className="master-panel-title"><div><span className="master-eyebrow">Base técnica</span><h2>Profissionais vinculados</h2></div><strong>{members.length}</strong></div>
        {loading ? <p>Carregando...</p> : members.length === 0 ? <p>Nenhum profissional vinculado.</p> : members.map((member) => <article className="master-list-row" key={member.id}><div><strong>{member.nome || "Nome não informado"}</strong><span>{member.instituicao?.nome || "Instituição não identificada"} · {ROLE_LABEL[member.papel] || member.papel}</span><small>{member.email || "E-mail não informado"} · {member.ativo ? "Ativo" : "Inativo"}</small></div><div className="master-row-actions"><button className="master-button" onClick={() => edit(member)}>Editar</button><button className="master-button danger" onClick={() => remove(member)}>Excluir</button></div></article>)}
      </div>
    </section>
  </div></main>;
}
