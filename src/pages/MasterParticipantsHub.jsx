import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";
import "../styles/participants-hub.css";

export default function MasterParticipantsHub() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ participantes: 0, pendentes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error: requestError } = await supabase.from("agp_participantes_projeto").select("id,status_onboarding,ativo").eq("ativo", true);
      if (requestError) setError(`Não foi possível carregar os participantes: ${requestError.message}`);
      else {
        const rows = data || [];
        const pendentes = rows.filter((item) => !["apto", "concluido", "ativo", "apto_para_coleta"].includes(String(item.status_onboarding || "").toLowerCase())).length;
        setCounts({ participantes: rows.length, pendentes });
      }
      setLoading(false);
    }
    load();
  }, []);

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">Participantes</span><h1>Pessoas do AGP</h1><p>Encontre a pessoa. O AGP mostra o que precisa ser feito a partir dela.</p></div><button className="master-button secondary" onClick={() => navigate("/dashboard-master")}>Voltar</button></header>
    {error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-content-grid">
      <button className="master-action-card" onClick={() => navigate("/master/atletas")}><strong>{loading ? "…" : counts.participantes} participantes ativos</strong><span>Consultar pessoas e continuar pela próxima ação necessária.</span></button>
      <button className="master-action-card" onClick={() => navigate("/master/participantes/operacao?servico=cadastro")}><strong>Cadastrar participante</strong><span>Adicionar uma nova pessoa e seu vínculo ao AGP.</span></button>
      {counts.pendentes > 0 && <button className="master-action-card" onClick={() => navigate("/master/atletas")}><strong>{counts.pendentes} precisam de atenção</strong><span>Abrir participantes com preparação ainda incompleta.</span></button>}
    </section>
    <details className="master-panel"><summary>Administração de participantes</summary><p>Funções estruturais para uso somente quando houver necessidade administrativa.</p><div className="master-row-actions"><button className="master-button secondary" onClick={() => navigate("/master/participantes/operacao?servico=tecnico")}>Vínculos técnicos</button><button className="master-button secondary" onClick={() => navigate("/master/participantes/operacao?servico=consentimento")}>Consentimentos</button><button className="master-button secondary" onClick={() => navigate("/master/participantes/operacao?servico=linha-base")}>Linha de base</button><button className="master-button secondary" onClick={() => navigate("/master/participantes/operacao?servico=elegibilidade")}>Elegibilidade</button></div></details>
  </div></main>;
}
