import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";
import "../styles/participants-hub.css";

export default function MasterParticipantsHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const context = params.get("context");
  const role = params.get("role");
  const homologacao = context === "homologacao";
  const profissional = homologacao && role === "profissional";
  const atleta = homologacao && role === "atleta";
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

  function operation(servico) {
    const query = new URLSearchParams();
    query.set("servico", servico);
    if (homologacao) query.set("context", "homologacao");
    if (role) query.set("role", role);
    navigate(`/master/participantes/operacao?${query.toString()}`);
  }

  const title = profissional ? "Técnico e profissionais da N1 · Natação" : atleta ? "Atleta da N1 · Natação — Homologação" : "Pessoas do AGP";
  const subtitle = profissional ? "Cadastre primeiro os responsáveis que produzirão, validarão e interpretarão evidências neste ciclo controlado." : atleta ? "Cadastre o atleta controlado que percorrerá o ciclo completo antes da entrada dos dados reais da N1." : "Encontre a pessoa. O AGP mostra o que precisa ser feito a partir dela.";
  const actionTitle = profissional ? "Cadastrar técnico ou profissional" : atleta ? "Cadastrar atleta de homologação" : "Cadastrar participante";
  const actionText = profissional ? "Adicionar o responsável e vinculá-lo ao projeto Natação Competitiva." : atleta ? "Adicionar o atleta controlado e vinculá-lo ao projeto Natação Competitiva." : "Adicionar uma nova pessoa e seu vínculo ao AGP.";

  return <main className="dashboard-master"><div className="dashboard-overlay master-page">
    <header className="dashboard-header master-header"><div><span className="master-eyebrow">{homologacao ? "Homologação Master" : "Participantes"}</span><h1>{title}</h1><p>{subtitle}</p></div><button className="master-button secondary" onClick={() => navigate(homologacao ? "/master/homologacao" : "/dashboard-master")}>Voltar</button></header>
    {error && <div className="master-error" role="alert">{error}</div>}
    <section className="master-content-grid">
      {!homologacao && <button className="master-action-card" onClick={() => navigate("/master/atletas")}><strong>{loading ? "…" : counts.participantes} participantes ativos</strong><span>Consultar pessoas e continuar pela próxima ação necessária.</span></button>}
      <button className="master-action-card" onClick={() => operation("cadastro")}><strong>{actionTitle}</strong><span>{actionText}</span></button>
      {!homologacao && counts.pendentes > 0 && <button className="master-action-card" onClick={() => navigate("/master/atletas")}><strong>{counts.pendentes} precisam de atenção</strong><span>Abrir participantes com preparação ainda incompleta.</span></button>}
    </section>
    {!homologacao && <details className="master-panel"><summary>Administração de participantes</summary><p>Funções estruturais para uso somente quando houver necessidade administrativa.</p><div className="master-row-actions"><button className="master-button secondary" onClick={() => operation("tecnico")}>Vínculos técnicos</button><button className="master-button secondary" onClick={() => operation("consentimento")}>Consentimentos</button><button className="master-button secondary" onClick={() => operation("linha-base")}>Linha de base</button><button className="master-button secondary" onClick={() => operation("elegibilidade")}>Elegibilidade</button></div></details>}
  </div></main>;
}
