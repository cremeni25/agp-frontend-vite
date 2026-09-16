import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { listProjectBaselines, saveParticipantBaseline } from "../services/baselineManagement";
import "../styles/dashboard-master.css";

function idadeNaData(dataNascimento, dataReferencia) {
  if (!dataNascimento || !dataReferencia) return "";
  const nasc = new Date(`${dataNascimento}T00:00:00`);
  const ref = new Date(`${dataReferencia}T00:00:00`);
  if (Number.isNaN(nasc.getTime()) || Number.isNaN(ref.getTime())) return "";
  let idade = ref.getFullYear() - nasc.getFullYear();
  const antesAniversario = ref.getMonth() < nasc.getMonth() || (ref.getMonth() === nasc.getMonth() && ref.getDate() < nasc.getDate());
  if (antesAniversario) idade -= 1;
  return idade > 0 ? idade : "";
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

export default function MasterBaselineContextual() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const projetoId = params.get("projeto") || "";
  const participanteId = params.get("participante") || "";

  const hoje = new Date().toISOString().slice(0, 10);
  const [athlete, setAthlete] = useState(null);
  const [profile, setProfile] = useState(null);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({
    sexo_registrado: "",
    altura_cm: "",
    altura_sentado_cm: "",
    massa_kg: "",
    envergadura_cm: "",
    data_referencia: hoje,
    observacoes: ""
  });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const idade = useMemo(
    () => idadeNaData(athlete?.data_nascimento, form.data_referencia),
    [athlete?.data_nascimento, form.data_referencia]
  );

  async function refreshBaseline() {
    const rows = await listProjectBaselines(projetoId);
    const existing = (rows || []).find(
      (item) => String(item.participante_id) === String(participanteId) && item.vigente
    );
    setCurrent(existing || null);
    return existing || null;
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const participantResult = await supabase
          .from("agp_participantes_elegibilidade")
          .select("participante_id,projeto_id,pessoa_id,nome,data_nascimento,ativo")
          .eq("participante_id", participanteId)
          .maybeSingle();
        if (participantResult.error) throw participantResult.error;
        if (!participantResult.data) throw new Error("Atleta não encontrado.");
        setAthlete(participantResult.data);

        const profileResult = await supabase
          .from("agp_perfis_esportivos")
          .select("modalidade,prova_posicao,categoria,nivel,status")
          .eq("pessoa_id", participantResult.data.pessoa_id)
          .eq("status", "ativo")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (profileResult.error) throw profileResult.error;
        setProfile(profileResult.data || null);

        const existing = await refreshBaseline();
        if (existing) {
          setForm({
            sexo_registrado: existing.sexo_registrado || "",
            altura_cm: existing.altura_cm ?? "",
            altura_sentado_cm: existing.altura_sentado_cm ?? "",
            massa_kg: existing.massa_kg ?? "",
            envergadura_cm: existing.envergadura_cm ?? "",
            data_referencia: existing.data_referencia || hoje,
            observacoes: existing.observacoes || ""
          });
        }
      } catch (e) {
        setError(`Falha ao carregar linha de base: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [participanteId, projetoId]);

  async function submit(event) {
    event.preventDefault();
    setWorking(true);
    setMessage("");
    setError("");
    try {
      const altura = Number(String(form.altura_cm).replace(",", "."));
      const alturaSentado = Number(String(form.altura_sentado_cm).replace(",", "."));
      const massa = Number(String(form.massa_kg).replace(",", "."));
      const envergadura = form.envergadura_cm
        ? Number(String(form.envergadura_cm).replace(",", "."))
        : null;

      if (!idade) throw new Error("A idade não pôde ser calculada a partir da data de nascimento.");
      if (!(altura > 30 && altura <= 260)) throw new Error("Informe a altura em centímetros. Exemplo: 175.");
      if (!(alturaSentado > 30 && alturaSentado < altura)) {
        throw new Error("Informe a altura sentada em centímetros. Ela deve ser menor que a altura total.");
      }
      if (!(massa > 5 && massa <= 400)) throw new Error("Informe a massa em quilogramas. Exemplo: 70.");
      if (envergadura !== null && !(envergadura > 30 && envergadura <= 300)) {
        throw new Error("Informe a envergadura em centímetros. Exemplo: 181.");
      }

      const result = await saveParticipantBaseline(participanteId, {
        categoria: profile?.categoria || "Não informada",
        idade_cronologica: idade,
        sexo_registrado: form.sexo_registrado,
        modalidade: profile?.modalidade || "Não informada",
        prova_posicao: profile?.prova_posicao || null,
        estagio_maturacional: null,
        altura_cm: altura,
        altura_sentado_cm: alturaSentado,
        massa_kg: massa,
        envergadura_cm: envergadura,
        data_referencia: form.data_referencia,
        origem: "avaliacao_institucional",
        observacoes: form.observacoes || null,
        validar: true
      });

      const updated = await refreshBaseline();
      const classificacao = updated?.classificacao_maturacional || result?.classificacao_maturacional;
      const metodo = updated?.metodo_maturacional || result?.metodo_maturacional;
      setMessage(
        classificacao
          ? `Linha de base registrada. Estágio maturacional estimado: ${classificacao}${metodo ? ` (${metodo})` : ""}.`
          : `Linha de base registrada com ${result?.completude ?? ""}% de completude. O AGP ainda não retornou classificação maturacional; a coleta permanece rastreada sem inventar resultado.`
      );
    } catch (e) {
      setError(`Falha ao registrar linha de base: ${e.message}`);
    } finally {
      setWorking(false);
    }
  }

  const maturityReady = Boolean(current?.classificacao_maturacional);

  return (
    <main className="dashboard-master">
      <div className="dashboard-overlay master-page">
        <header className="dashboard-header master-header">
          <div>
            <span className="master-eyebrow">Parâmetros iniciais</span>
            <h1>Linha de base</h1>
            <p>O AGP preenche o que já conhece e solicita somente medidas que precisam ser informadas.</p>
          </div>
          <button className="master-button secondary" onClick={() => navigate("/master/homologacao")}>Voltar à Homologação</button>
        </header>

        {message && <div className="master-success">{message}</div>}
        {error && <div className="master-error" role="alert">{error}</div>}

        {loading ? (
          <div className="master-empty">Carregando linha de base...</div>
        ) : (
          <form className="master-panel" onSubmit={submit}>
            <div className="master-section-heading">
              <div>
                <span className="master-eyebrow">Linha de base</span>
                <h2>{athlete?.nome}</h2>
              </div>
              <strong>{current ? "Registrada" : "Pendente"}</strong>
            </div>

            <div className="master-toolbar">
              <label style={{ flex: 1 }}>Categoria<input className="master-input" value={profile?.categoria || ""} readOnly /></label>
              <label style={{ flex: 1 }}>Idade cronológica<input className="master-input" value={idade} readOnly /></label>
              <label style={{ flex: 1 }}>Sexo registrado
                <select className="master-select" required value={form.sexo_registrado} onChange={(e) => setForm({ ...form, sexo_registrado: e.target.value })}>
                  <option value="">Selecionar</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
            </div>

            <div className="master-toolbar">
              <label style={{ flex: 1 }}>Modalidade<input className="master-input" value={profile?.modalidade || ""} readOnly /></label>
              <label style={{ flex: 1 }}>Prova/posição<input className="master-input" value={profile?.prova_posicao || ""} readOnly /></label>
            </div>

            <div className="master-panel" style={{ marginTop: 16 }}>
              <strong>Estágio maturacional</strong>
              {maturityReady ? (
                <div style={{ marginTop: 10 }}>
                  <div><strong>{current.classificacao_maturacional}</strong></div>
                  <div>Método: {current.metodo_maturacional || "registrado"}</div>
                  {current.offset_maturacional_anos !== null && current.offset_maturacional_anos !== undefined && (
                    <div>Offset maturacional: {formatNumber(current.offset_maturacional_anos)} ano(s)</div>
                  )}
                  {current.idade_pico_velocidade_anos !== null && current.idade_pico_velocidade_anos !== undefined && (
                    <div>Idade estimada no pico de velocidade de crescimento: {formatNumber(current.idade_pico_velocidade_anos)} anos</div>
                  )}
                  {current.maturacao_observacoes && <p>{current.maturacao_observacoes}</p>}
                </div>
              ) : (
                <p>Será estimado automaticamente depois que idade, sexo, altura, altura sentada e massa estiverem informados. O resultado será registrado com método, valor estimado e limitação de interpretação.</p>
              )}
            </div>

            <div className="master-toolbar">
              <label style={{ flex: 1 }}>Altura (cm)<input className="master-input" required inputMode="decimal" placeholder="Ex.: 175" value={form.altura_cm} onChange={(e) => setForm({ ...form, altura_cm: e.target.value })} /></label>
              <label style={{ flex: 1 }}>Altura sentada (cm)<input className="master-input" required inputMode="decimal" placeholder="Ex.: 91" value={form.altura_sentado_cm} onChange={(e) => setForm({ ...form, altura_sentado_cm: e.target.value })} /></label>
              <label style={{ flex: 1 }}>Massa (kg)<input className="master-input" required inputMode="decimal" placeholder="Ex.: 70" value={form.massa_kg} onChange={(e) => setForm({ ...form, massa_kg: e.target.value })} /></label>
              <label style={{ flex: 1 }}>Envergadura (cm)<input className="master-input" inputMode="decimal" placeholder="Ex.: 181" value={form.envergadura_cm} onChange={(e) => setForm({ ...form, envergadura_cm: e.target.value })} /></label>
            </div>

            <label>Data de referência<input className="master-input" type="date" required value={form.data_referencia} onChange={(e) => setForm({ ...form, data_referencia: e.target.value })} /></label>
            <label>Observações<textarea className="master-input" rows="4" placeholder="Opcional" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></label>

            <button className="master-button" disabled={working}>{working ? "Salvando..." : current ? "Atualizar linha de base" : "Salvar linha de base"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
