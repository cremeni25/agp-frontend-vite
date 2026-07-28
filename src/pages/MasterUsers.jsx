import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { normalizeUserType } from "../config/accessProfiles";
import "../styles/dashboard-master.css";

const API_URL = import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com";

function resolveType(user) {
  return normalizeUserType(user.tipo_usuario || user.funcao) || "não definido";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function MasterUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("todos");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", tipo_usuario: "atleta", instituicao: "", dias_acesso: 30 });

  async function loadUsers() {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("perfis_atletas")
      .select("*")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(`Não foi possível carregar os usuários: ${queryError.message}`);
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function inviteUser(event) {
    event.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Sessão Master expirada. Entre novamente.");
      setSending(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...form,
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          instituicao: form.instituicao.trim() || null,
          dias_acesso: Number(form.dias_acesso)
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Não foi possível enviar o convite.");

      setSuccess(`Convite enviado para ${form.email}. O acesso foi criado com perfil ${form.tipo_usuario}.`);
      setForm({ nome: "", email: "", tipo_usuario: "atleta", instituicao: "", dias_acesso: 30 });
      await loadUsers();
    } catch (inviteError) {
      setError(inviteError.message);
    } finally {
      setSending(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const userType = resolveType(user);
      const matchesType = type === "todos" || userType === type;
      const searchable = [user.nome, user.email, user.clube, user.instituicao, user.categoria, user.auth_id]
        .filter(Boolean).join(" ").toLowerCase();
      return matchesType && (!term || searchable.includes(term));
    });
  }, [users, search, type]);

  return (
    <main className="dashboard-master">
      <div className="dashboard-overlay master-page">
        <header className="dashboard-header master-header">
          <div>
            <span className="master-eyebrow">Administração AGP</span>
            <h1>Gestão de usuários</h1>
            <p>Criação, convite e acompanhamento da base institucional.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button>
            <button className="master-button" onClick={loadUsers}>Atualizar</button>
          </div>
        </header>

        <section className="master-panel" style={{ marginBottom: 24 }}>
          <div className="master-section-heading">
            <div>
              <span className="master-eyebrow">Novo acesso</span>
              <h2>Criar e convidar usuário</h2>
            </div>
          </div>
          <form className="master-toolbar" onSubmit={inviteUser} style={{ gridTemplateColumns: "1fr 1fr 220px 1fr 140px auto" }}>
            <input className="master-input" placeholder="Nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            <input className="master-input" type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <select className="master-select" value={form.tipo_usuario} onChange={(e) => setForm({ ...form, tipo_usuario: e.target.value })}>
              <option value="atleta">Atleta</option>
              <option value="comissao">Comissão técnica</option>
              <option value="clube">Clube / Associação</option>
              <option value="master">Master</option>
            </select>
            <input className="master-input" placeholder="Instituição ou clube" value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} />
            <input className="master-input" type="number" min="1" max="365" value={form.dias_acesso} onChange={(e) => setForm({ ...form, dias_acesso: e.target.value })} title="Dias de acesso" />
            <button className="master-button" type="submit" disabled={sending}>{sending ? "Enviando..." : "Criar e convidar"}</button>
          </form>
        </section>

        {error && <div className="master-error" role="alert">{error}</div>}
        {success && <div className="agp-alert agp-alert-success" role="status">{success}</div>}

        <section className="master-toolbar">
          <input className="master-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, clube ou ID" />
          <select className="master-select" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="todos">Todos os perfis</option>
            <option value="master">Master</option>
            <option value="atleta">Atletas</option>
            <option value="comissao">Comissão técnica</option>
            <option value="clube">Clubes</option>
            <option value="não definido">Não definidos</option>
          </select>
          <span className="master-result-count">{filteredUsers.length} registro(s)</span>
        </section>

        <section className="master-table-card">
          {loading ? <div className="dashboard-loading">Carregando usuários...</div> : filteredUsers.length === 0 ? (
            <div className="master-empty">Nenhum usuário encontrado para os filtros selecionados.</div>
          ) : (
            <div className="master-table-wrap">
              <table className="master-table">
                <thead><tr><th>Usuário</th><th>Perfil</th><th>Vínculo</th><th>Status</th><th>Expira em</th><th>Criado em</th></tr></thead>
                <tbody>{filteredUsers.map((user) => {
                  const userType = resolveType(user);
                  const status = user.status || (user.ativo === false ? "inativo" : "ativo");
                  return (
                    <tr key={user.id || user.auth_id}>
                      <td><strong>{user.nome || "Nome não informado"}</strong><span>{user.email || user.auth_id || "—"}</span></td>
                      <td><span className={`master-badge ${userType}`}>{userType}</span></td>
                      <td>{user.clube || user.instituicao || user.categoria || "Sem vínculo informado"}</td>
                      <td><span className={`master-status ${String(status).toLowerCase()}`}>{status}</span></td>
                      <td>{formatDate(user.acesso_expira_em)}</td>
                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
