import { supabase } from "../supabaseClient";

const API_URL = (import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com").replace(/\/$/, "");

async function authorizedRequest(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sessão Master indisponível.");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      ...(options.headers || {})
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

export function listProjectBaselines(projectId) {
  return authorizedRequest(`/api/v1/projetos/${projectId}/linhas-base`);
}

export function saveParticipantBaseline(participantId, payload) {
  return authorizedRequest(`/api/v1/participantes/${participantId}/linha-base`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
