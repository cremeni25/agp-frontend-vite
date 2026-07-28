import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { normalizeUserType } from "../config/accessProfiles";
import "../styles/dashboard-master.css";

function resolveType(user) {
  return normalizeUserType(user.tipo_usuario || user.funcao) || "não definido";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export default function MasterUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("todos");

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

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const userType = resolveType(user);
      const matchesType = type === "todos" || userType === type;
      const searchable = [user.nome, user.email, user.clube, user.categoria, user.auth_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
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
            <p>Base institucional vinculada ao Supabase.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button>
            <button className="master-button" onClick={loadUsers}>Atualizar</button>
          </div>
        </header>

        <section className="master-toolbar">
          <input
            className="master-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail, clube ou ID"
          />
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

        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="master-table-card">
          {loading ? (
            <div className="dashboard-loading">Carregando usuários...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="master-empty">Nenhum usuário encontrado para os filtros selecionados.</div>
          ) : (
            <div className="master-table-wrap">
              <table className="master-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Perfil</th>
                    <th>Vínculo</th>
                    <th>Status</th>
                    <th>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const userType = resolveType(user);
                    const status = user.status || (user.ativo === false ? "inativo" : "ativo");
                    return (
                      <tr key={user.id || user.auth_id}>
                        <td>
                          <strong>{user.nome || "Nome não informado"}</strong>
                          <span>{user.email || user.auth_id || "—"}</span>
                        </td>
                        <td><span className={`master-badge ${userType}`}>{userType}</span></td>
                        <td>{user.clube || user.instituicao || user.categoria || "Sem vínculo informado"}</td>
                        <td><span className={`master-status ${String(status).toLowerCase()}`}>{status}</span></td>
                        <td>{formatDate(user.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
