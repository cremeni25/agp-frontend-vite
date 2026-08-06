import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/dashboard-master.css";

const SERVICES = [
  { id: "cadastro", title: "Cadastrar participante", description: "Criar atleta ou profissional, definir instituição, projeto e perfil esportivo.", action: "Iniciar cadastro" },
  { id: "consulta", title: "Consultar participantes", description: "Pesquisar atletas cadastrados, vínculos institucionais e situação operacional.", action: "Abrir consulta" },
  { id: "tecnico", title: "Técnico responsável", description: "Vincular, alterar e consultar o histórico técnico de cada atleta.", action: "Gerenciar vínculos" },
  { id: "consentimento", title: "Consentimentos", description: "Conceder, consultar ou revogar consentimentos operacionais vigentes.", action: "Gerenciar consentimentos" },
  { id: "linha-base", title: "Linha de base", description: "Registrar, consultar ou atualizar os parâmetros iniciais do atleta.", action: "Gerenciar linha de base" },
  { id: "elegibilidade", title: "Elegibilidade", description: "Consultar pendências, liberação de coleta e liberação de análise.", action: "Consultar elegibilidade" }
];

export default function MasterParticipantsHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ participantes: 0, aptos: 0, pendentes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const contextParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.delete("servico");
    return params;
  }, [location.search]);

  const selectedParticipant = contextParams.get("participante");

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setError("");
      try {
        const { data, error: requestError } = await supabase
          .from("agp_participantes_projeto")
          .select("id,status_onboarding,ativo")
          .eq("ativo", true);
        if (requestError) throw requestError;
        const rows = data || [];
        const aptos = rows.filter((item) => ["apto", "concluido", "ativo"].includes(String(item.status_onboarding || "").toLowerCase())).length;
        setCounts({ participantes: rows.length, aptos, pendentes: Math.max(rows.length - aptos, 0) });
      } catch (requestError) {
        setError(`Não foi possível carregar o resumo operacional: ${requestError.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  const statusLabel = useMemo(() => loading ? "Atualizando" : `${counts.participantes} participante(s)`, [counts.participantes, loading]);

  function openService(serviceId) {
    if (serviceId === "consulta") {
      navigate("/master/atletas");
      return;
    }
    const params = new URLSearchParams(contextParams);
    params.set("servico", serviceId);
    navigate(`/master/participantes/operacao?${params.toString()}`);
  }

  return (
    <main className="dashboard-master">
      <div className="dashboard-overlay master-page">
        <header className="dashboard-header master-header">
          <div>
            <span className="master-eyebrow">Governança institucional</span>
            <h1>Central de Participantes</h1>
            <p>Selecione o serviço necessário. Cada operação abre somente o fluxo correspondente.</p>
          </div>
          <button className="master-button secondary" onClick={() => navigate(selectedParticipant ? "/master/atletas" : "/dashboard-master")}>Voltar</button>
        </header>

        {error && <div className="master-error" role="alert">{error}</div>}
        {selectedParticipant && <div className="master-success">Participante selecionado. Escolha abaixo o serviço que deseja consultar ou executar.</div>}

        <section className="master-content-grid">
          <article className="master-panel"><span className="master-eyebrow">Base ativa</span><h2>{statusLabel}</h2><p>Participantes canônicos ativos vinculados aos projetos do AGP.</p></article>
          <article className="master-panel"><span className="master-eyebrow">Fluxos concluídos</span><h2>{loading ? "—" : counts.aptos}</h2><p>Participantes sem pendências de onboarding registradas.</p></article>
          <article className="master-panel"><span className="master-eyebrow">Atenção operacional</span><h2>{loading ? "—" : counts.pendentes}</h2><p>Participantes que ainda exigem alguma operação ou validação.</p></article>
        </section>

        <section className="master-panel">
          <div className="master-section-heading"><div><span className="master-eyebrow">Serviços da Central</span><h2>O que você precisa fazer?</h2></div></div>
          <div className="master-content-grid">
            {SERVICES.map((service) => (
              <button key={service.id} type="button" className="master-panel" onClick={() => openService(service.id)} style={{ textAlign: "left", cursor: "pointer", width: "100%" }}>
                <span className="master-eyebrow">Serviço</span><h2>{service.title}</h2><p>{service.description}</p><strong>{service.action} →</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
