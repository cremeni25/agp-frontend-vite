import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listInstitutions } from "../services/institutionManagement";
import SwimmingShell from "../components/SwimmingShell";

export default function MasterInstitutionsDirectory() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setInstitutions(await listInstitutions()); }
    catch (requestError) {
      setError(`Falha ao consultar instituições: ${requestError.message}`);
      setInstitutions([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return institutions;
    return institutions.filter((item) => [item.nome, item.tipo, item.localidade, item.status]
      .some((value) => String(value || "").toLowerCase().includes(term)));
  }, [institutions, search]);

  return <SwimmingShell
    eyebrow="Governança · Instituições"
    title="Clubes e associações"
    subtitle="Consulta institucional do AGP Swim em uma única experiência visual, com contexto, vínculo e continuidade operacional."
    actions={[
      {label:"Voltar",onClick:()=>navigate("/dashboard-master")},
      {label:"Atualizar",onClick:load}
    ]}
  >
    {error&&<div className="swim-notice">{error}</div>}

    <section className="swim-panel">
      <div className="swim-panel-head">
        <div><span className="swim-panel-label">Busca</span><h2>Encontrar instituição</h2></div>
        <span className="swim-pill">{filtered.length} instituição(ões)</span>
      </div>
      <input className="training-select" style={{width:"100%"}} placeholder="Buscar por nome, tipo, localidade ou status" value={search} onChange={(event)=>setSearch(event.target.value)} />
    </section>

    <section className="swim-panel">
      <span className="swim-panel-label">Base institucional</span>
      <h2>Instituições cadastradas</h2>
      {loading?<div className="swim-empty">Carregando instituições...</div>:filtered.length===0?<div className="swim-empty">Nenhuma instituição encontrada.</div>:
        <div className="swim-list">{filtered.map((item)=><article className="swim-row" key={item.id}>
          <div>
            <strong>{item.nome}</strong>
            <span>{[item.tipo||"Tipo não informado",item.localidade||"Localidade não informada"].join(" · ")}</span>
            <small>{item.status||"Status não informado"}</small>
          </div>
          <span className="swim-pill">{item.status||"instituição"}</span>
        </article>)}</div>}
    </section>
  </SwimmingShell>;
}
