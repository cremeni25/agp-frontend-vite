import { supabase } from "../supabaseClient";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com").replace(/\/$/, "");

async function authorizedRequest(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Falha ao recuperar sessão: ${error.message}`);
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão Master não encontrada.");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : detail?.mensagem || `Falha HTTP ${response.status}`);
  }
  return body;
}

export function getAthleteIntelligence(participantId) {
  return authorizedRequest(`/api/v1/participantes/${participantId}/inteligencia`);
}

export function getAthleteIndividualIntelligence(participantId) {
  return authorizedRequest(`/api/v1/participantes/${participantId}/inteligencia-v4`);
}

export function createAthleteTrainingSession(participantId, payload) {
  return authorizedRequest(`/api/v1/participantes/${participantId}/sessoes`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
