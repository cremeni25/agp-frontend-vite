import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { normalizeUserType } from "../config/accessProfiles";
import "../styles/dashboard-master.css";

const PROFILE_OPTIONS = [
  { value: "master", label: "Master" },
  { value: "atleta", label: "Atleta" },
  { value: "comissao", label: "Comissão técnica" },
  { value: "clube", label: "Clube / Associação" }
];

function currentType(user) {
  return normalizeUserType(user.tipo_usuario || user.funcao) || "";
}

export default function MasterProfiles() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("perfis_atletas")
      .select("*")
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function updateProfile(user, tipoUsuario) {
    setSavingId(user.id || user.auth_id);
    setMessage("");
    setError("");
    const { error: updateError } = await supabase
      .from("perfis_atletas")
      .update({ tipo_usuario: tipoUsuario, funcao: tipoUsuario })
      .eq("id", user.id);
    if (updateError) {
      setError(`Não foi possível atualizar o perfil: ${updateError.message}`);
    } else {
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, tipo_usuario: tipoUsuario, funcao: tipoUsuario } : item));
      setMessage("Perfil e permissão atualizados com sucesso.");
    }
    setSavingId(null);
  }

  const undefinedCount = useMemo(() => users.filter((user) => !currentType(user)).length, [users]);

  return (
    <main className="dashboard-master">
      <div className="dashboard-overlay master-page">
        <header className="dashboard-header master-header">
          <div>
            <span className="master-eyebrow">Administração AGP</span>
            <h1>Perfis e permissões</h1>
            <p>Definição efetiva das áreas de acesso de cada usuário.</p>
          </div>
          <div className="master-header-actions">
            <button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button>
            <button className="master-button" onClick={loadUsers}>Atualizar</button>
          </div>
        </header>

        {message && <div className="master-success">{message}</div>}
        {error && <div className="master-error" role="alert">{error}</div>}

        <section className="master-panel">
          <div className="master-section-heading"><div><span className="master-eyebrow">Pendências</span><h2>Perfis não definidos</h2></div><strong>{undefinedCount}</strong></div>
          <p>Selecione o perfil correto para liberar a rota correspondente.</p>
        </section>

        <section className="master-table-card">
          {loading ? <div className="dashboard-loading">Carregando perfis...</div> : (
            <div className="master-table-wrap">
              <table className="master-table">
                <thead><tr><th>Usuário</th><th>Vínculo</th><th>Perfil atual</th><th>Definir acesso</th></tr></thead>
                <tbody>
                  {users.map((user) => {
                    const id = user.id || user.auth_id;
                    const type = currentType(user);
                    return (
                      <tr key={id}>
                        <td><strong>{user.nome || "Nome não informado"}</strong><span>{user.email || user.auth_id || "—"}</span></td>
                        <td>{user.clube || user.instituicao || "Sem vínculo informado"}</td>
                        <td><span className={`master-badge ${type || "não-definido"}`}>{type || "Não definido"}</span></td>
                        <td>
                          <select className="master-select compact" value={type} disabled={savingId === id} onChange={(event) => updateProfile(user, event.target.value)}>
                            <option value="" disabled>Selecionar perfil</option>
                            {PROFILE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </td>
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
