import { supabase } from "../supabaseClient";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com").replace(/\/$/, "");

async function request(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Falha ao recuperar sessão: ${error.message}`);
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão Master não encontrada.");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : detail?.mensagem || `Falha HTTP ${response.status}`);
  }
  return body;
}

export function getDecisionCycle(participantId) {
  return request(`/api/v1/participantes/${participantId}/ciclo-decisao`);
}

export function createProfessionalAssessment(participantId, payload) {
  return request(`/api/v1/participantes/${participantId}/avaliacoes-profissionais`, { method: "POST", body: payload });
}

export function createIntervention(participantId, payload) {
  return request(`/api/v1/participantes/${participantId}/intervencoes`, { method: "POST", body: payload });
}

export function createInterventionResponse(interventionId, payload) {
  return request(`/api/v1/intervencoes/${interventionId}/respostas`, { method: "POST", body: payload });
}
