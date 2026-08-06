import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listInstitutions } from "../services/institutionManagement";
import "../styles/dashboard-master.css";

export default function MasterInstitutionsDirectory() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setInstitutions(await listInstitutions()); }
    catch (requestError) { setError(`Falha ao consultar instituições: ${requestError.message}`); setInstitutions([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return institutions;
    return institutions.filter((item) => [item.nome, item.tipo, item.localidade, item.status].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [institutions, search]);

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Administração</span><h1>Clubes e associações</h1><p>Consulta global das instituições cadastradas no AGP.</p></div><div className="master-header-actions"><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button><button className="master-button" onClick={load}>Atualizar</button></div></header>
    {error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-panel"><input className="master-input" placeholder="Buscar por nome, tipo, localidade ou status" value={search} onChange={(event) => setSearch(event.target.value)} /></section>
    <section className="master-panel"><div className="master-section-heading"><div><span className="master-eyebrow">Base institucional</span><h2>Instituições cadastradas</h2></div><strong>{filtered.length}</strong></div>
      {loading ? <div className="master-empty">Carregando instituições...</div> : filtered.length === 0 ? <div className="master-empty">Nenhuma instituição encontrada.</div> : <ul className="master-activity-list">{filtered.map((item) => <li key={item.id}><div><strong>{item.nome}</strong><span>{item.tipo || "Tipo não informado"} · {item.localidade || "Localidade não informada"}</span><small>{item.status || "Status não informado"}</small></div></li>)}</ul>}
    </section>
  </div></main>;
}
