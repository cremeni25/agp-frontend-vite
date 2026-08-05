import { supabase } from "../supabaseClient";

const API_URL = (import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com").replace(/\/$/, "");

async function authorizedRequest(path) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sessão Master indisponível.");

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`
    }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail;
    const message = typeof detail === "string" ? detail : detail?.mensagem || JSON.stringify(detail || payload || {});
    throw new Error(message || `Falha HTTP ${response.status}`);
  }
  return payload;
}

export function listProjectEligibility(projectId) {
  return authorizedRequest(`/api/v1/projetos/${projectId}/elegibilidade`);
}

export function getParticipantEligibility(participantId) {
  return authorizedRequest(`/api/v1/participantes/${participantId}/elegibilidade`);
}

export const ELIGIBILITY_LABELS = {
  participante_inativo: "Participante inativo",
  perfil_esportivo_pendente: "Perfil esportivo pendente",
  tecnico_responsavel_pendente: "Técnico responsável pendente",
  tecnico_responsavel_invalido: "Técnico responsável inválido",
  consentimento_pendente: "Consentimento pendente",
  linha_base_pendente: "Linha de base pendente",
  instrumento_indisponivel: "Instrumento compatível indisponível",
  elegibilidade_indisponivel: "Elegibilidade indisponível"
};

export function formatEligibilityPending(items = []) {
  return items.map((item) => ELIGIBILITY_LABELS[item] || item.replaceAll("_", " "));
}
