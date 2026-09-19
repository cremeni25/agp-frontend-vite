import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import SwimmingShell from "../components/SwimmingShell";

export default function MasterFinancialExpansion() {
  const [data, setData] = useState({ institutions: [], projects: [], participants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    const [institutions, projects, participants] = await Promise.all([
      supabase.from("agp_instituicoes").select("id,nome,nome_exibicao,slug,status,tipo").order("nome"),
      supabase.from("agp_projetos_validacao").select("id,instituicao_id,nome,status"),
      supabase.from("agp_participantes_projeto").select("id,pessoa_id,projeto_id,funcao_no_projeto,ativo")
    ]);

    const firstError = institutions.error || projects.error || participants.error;
    if (firstError) setError("Não foi possível consolidar a expansão agora.");

    setData({
      institutions: institutions.data || [],
      projects: projects.data || [],
      participants: participants.data || []
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const activeInstitutions = data.institutions.filter((item) => item.status !== "inativo");
    const activeProjects = data.projects.filter((item) => item.status !== "inativo");
    const athleteIds = new Set(
      data.participants
        .filter((item) => item.ativo && item.funcao_no_projeto === "atleta")
        .map((item) => item.pessoa_id)
        .filter(Boolean)
    );

    return {
      institutions: activeInstitutions.length,
      projects: activeProjects.length,
      athletes: athleteIds.size
    };
  }, [data]);

  const institutionRows = useMemo(() => {
    return data.institutions.map((institution) => {
      const projects = data.projects.filter((project) => project.instituicao_id === institution.id);
      const projectIds = new Set(projects.map((project) => project.id));
      const athletes = new Set(
        data.participants
          .filter(
            (participant) =>
              participant.ativo &&
              participant.funcao_no_projeto === "atleta" &&
              projectIds.has(participant.projeto_id)
          )
          .map((participant) => participant.pessoa_id)
          .filter(Boolean)
      );

      return {
        id: institution.id,
        name: institution.nome_exibicao || institution.nome || "Instituição sem nome",
        status: institution.status || "—",
        type: institution.tipo || "—",
        projects: projects.length,
        athletes: athletes.size
      };
    });
  }, [data]);

  return (
    <SwimmingShell
      eyebrow="Master · Financeiro e expansão"
      title="Controle comercial preparado para crescer com o AGP"
      subtitle="Estrutura de acompanhamento institucional criada sem valores monetários. Preços, mensalidades, implantação e condições comerciais permanecerão bloqueados até a homologação ser concluída."
      actions={[{ label: "Atualizar", onClick: load }]}
    >
      {error && <div className="swim-notice">{error}</div>}

      <section className="swim-focus">
        <div>
          <span className="swim-eyebrow">Regra vigente</span>
          <h2>Valores comerciais bloqueados durante a homologação</h2>
          <p>
            O AGP já pode acompanhar expansão, capacidade e estrutura institucional. Nenhum preço,
            mensalidade, desconto, implantação ou faturamento será definido nesta etapa.
          </p>
        </div>
        <span className="swim-pill">Homologação em andamento</span>
      </section>

      <section className="swim-grid">
        <article className="swim-card">
          <span>Instituições</span>
          <strong className="swim-kpi">{loading ? "…" : summary.institutions}</strong>
          <p>Base institucional atualmente registrada no AGP.</p>
        </article>
        <article className="swim-card">
          <span>Projetos / operações</span>
          <strong className="swim-kpi">{loading ? "…" : summary.projects}</strong>
          <p>Contextos esportivos vinculados às instituições.</p>
        </article>
        <article className="swim-card">
          <span>Atletas ativos</span>
          <strong className="swim-kpi">{loading ? "…" : summary.athletes}</strong>
          <p>Atletas distintos vinculados à operação atual.</p>
        </article>
      </section>

      <section className="swim-panel">
        <div className="swim-panel-head">
          <div>
            <span className="swim-panel-label">Planos comerciais</span>
            <h2>Estrutura pronta, precificação ainda não liberada</h2>
          </div>
          <span className="swim-pill">Sem valores</span>
        </div>
        <div className="swim-two">
          <article className="swim-card">
            <span>Standard AGP</span>
            <strong>Aguardando homologação</strong>
            <p>Capacidade, faixas de atletas e condições serão definidas após a validação prática.</p>
          </article>
          <article className="swim-card">
            <span>Premium / marca institucional</span>
            <strong>Aguardando homologação</strong>
            <p>Condições de personalização e licenciamento serão tratadas somente depois da homologação.</p>
          </article>
        </div>
      </section>

      <section className="swim-panel">
        <div className="swim-panel-head">
          <div>
            <span className="swim-panel-label">Expansão institucional</span>
            <h2>Capacidade observada por instituição</h2>
          </div>
          <span className="swim-pill">{loading ? "…" : institutionRows.length + " instituição(ões)"}</span>
        </div>

        {loading ? (
          <div className="swim-empty">Consolidando estrutura...</div>
        ) : institutionRows.length === 0 ? (
          <div className="swim-empty">Nenhuma instituição registrada.</div>
        ) : (
          <div className="swim-list">
            {institutionRows.map((institution) => (
              <div className="swim-row" key={institution.id}>
                <div>
                  <strong>{institution.name}</strong>
                  <span>{institution.type} · {institution.status}</span>
                  <small>{institution.projects} projeto(s) · {institution.athletes} atleta(s) ativo(s)</small>
                </div>
                <span className="swim-pill">Valores indisponíveis</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="swim-panel">
        <span className="swim-panel-label">Próxima etapa comercial</span>
        <h2>Precificação somente depois da homologação efetivada</h2>
        <p className="swim-muted">
          Quando a homologação for encerrada, esta área poderá receber planos, faixas de capacidade,
          valores contratados, implantação, descontos, recorrência, vencimentos, faturamento,
          recebimentos e projeções. Até lá, o financeiro permanece deliberadamente sem valores.
        </p>
      </section>
    </SwimmingShell>
  );
}
