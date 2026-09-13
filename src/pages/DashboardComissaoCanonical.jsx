import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-comissao.css";

function state(row) {
  if (!row.last) return { label: "Sem evidência recente", level: 2 };
  const hours = (Date.now() - new Date(row.last).getTime()) / 36e5;
  if (hours > 48) return { label: "Precisa de atenção", level: 2 };
  if (hours > 24) return { label: "Acompanhar", level: 1 };
  return { label: "Sem pendência imediata", level: 0 };
}

export default function DashboardComissaoCanonical() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const personId = perfil?.pessoa_id;
      if (!personId) { setRows([]); return; }

      const participantsResult = await supabase
        .from("agp_participantes_projeto")
        .select("id,pessoa_id,projeto_id,status_onboarding,ativo")
        .eq("funcao_no_projeto", "atleta")
        .eq("ativo", true)
        .eq("tecnico_responsavel_pessoa_id", personId);

      if (participantsResult.error) throw participantsResult.error;
      const participants = participantsResult.data || [];
      if (!participants.length) { setRows([]); return; }

      const personIds = [...new Set(participants.map((item) => item.pessoa_id))];
      const participantIds = participants.map((item) => item.id);
      const [people, profiles, collections] = await Promise.all([
        supabase.from("agp_pessoas").select("id,nome").in("id", personIds),
        supabase.from("agp_perfis_esportivos").select("pessoa_id,modalidade,categoria,nivel,status").in("pessoa_id", personIds),
        supabase.from("agp_coletas").select("participante_id,data_hora_coleta,status").in("participante_id", participantIds).order("data_hora_coleta", { ascending: false })
      ]);

      const firstError = people.error || profiles.error || collections.error;
      if (firstError) throw firstError;

      const peopleMap = Object.fromEntries((people.data || []).map((item) => [item.id, item]));
      const profilesMap = Object.fromEntries((profiles.data || []).filter((item) => item.status === "ativo").map((item) => [item.pessoa_id, item]));
      const latest = {};
      for (const item of collections.data || []) if (!latest[item.participante_id]) latest[item.participante_id] = item;

      setRows(participants.map((item) => ({
        ...item,
        person: peopleMap[item.pessoa_id] || {},
        profile: profilesMap[item.pessoa_id] || {},
        last: latest[item.id]?.data_hora_coleta || null,
        lastStatus: latest[item.id]?.status || null
      })));
    } catch (e) {
      setRows([]);
      setError("Não foi possível carregar o acompanhamento deste acesso.");
    } finally {
      setLoading(false);
    }
  }

  async function open(row) {
    setSelected(row);
    setHistory([]);
    const result = await supabase
      .from("agp_coletas")
      .select("id,data_hora_coleta,status,completude,confiabilidade,dados")
      .eq("participante_id", row.id)
      .order("data_hora_coleta", { ascending: false })
      .limit(14);
    if (result.error) setError("Não foi possível abrir o histórico deste atleta.");
    else setHistory(result.data || []);
  }

  function openValidation(row) {
    navigate(`/comissao/validacao?projeto=${encodeURIComponent(row.projeto_id)}&participante=${encodeURIComponent(row.id)}`);
  }

  useEffect(() => { load(); }, [perfil?.pessoa_id]);

  const ordered = useMemo(() => [...rows].sort((a, b) => state(b).level - state(a).level), [rows]);
  const next = ordered.find((item) => state(item).level > 0) || ordered[0] || null;

  if (loading) return <div className="dashboard-loading">Preparando seu acompanhamento...</div>;

  return <main className="dashboard-comissao"><div className="dashboard-overlay">
    <header className="dashboard-header"><div><span>AGP · Comissão técnica</span><h1>Quem precisa da sua atenção agora?</h1><p>Pessoas, evidências e decisão profissional no mesmo fluxo.</p></div><button onClick={load}>Atualizar</button></header>
    {error && <div className="master-error" role="alert">{error}</div>}

    <section className="dashboard-section"><h2>{next ? state(next).label : "Nenhum atleta vinculado"}</h2>{next ? <article className="athlete-card"><h3>{next.person.nome || "Atleta"}</h3><p>{next.profile.modalidade || next.profile.categoria || next.profile.nivel || "Acompanhamento ativo"}</p><strong>{next.last ? `Última evidência: ${new Date(next.last).toLocaleString("pt-BR")}` : "Ainda sem evidência recente"}</strong><button onClick={() => open(next)}>Abrir acompanhamento</button><button onClick={() => openValidation(next)}>Validar resultado</button></article> : <p>Nenhum atleta está vinculado a este profissional.</p>}</section>

    {selected && <section className="dashboard-section"><h2>{selected.person.nome || "Atleta"}</h2><p>Histórico recente para decisão profissional.</p><button onClick={() => openValidation(selected)}>Abrir fila de validação</button>{history.length === 0 ? <p>Ainda não há evidências disponíveis.</p> : <div className="alert-list">{history.map((item) => <article key={item.id} className="athlete-card"><strong>{new Date(item.data_hora_coleta).toLocaleString("pt-BR")}</strong><span>{item.status || "registro"}{item.completude != null ? ` · completude ${item.completude}%` : ""}</span><details><summary>Ver evidência</summary><pre>{JSON.stringify(item.dados, null, 2)}</pre></details></article>)}</div>}</section>}

    <details className="dashboard-section"><summary>Ver todos os atletas</summary><div className="athlete-grid">{ordered.map((item) => { const current = state(item); return <article key={item.id} className={`athlete-card ${current.level === 2 ? "critical" : current.level === 1 ? "warning" : "ok"}`}><h3>{item.person.nome || "Atleta"}</h3><p>{item.profile.modalidade || item.profile.categoria || item.profile.nivel || ""}</p><strong>{current.label}</strong><button onClick={() => open(item)}>Abrir acompanhamento</button><button onClick={() => openValidation(item)}>Validar resultado</button></article>; })}</div></details>
  </div></main>;
}
