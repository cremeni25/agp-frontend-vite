import { supabase } from "../supabaseClient";

const API_BASE_URL = String(
  import.meta.env.VITE_AGP_API_URL || "https://performance-atleta-ai.onrender.com"
).replace(/\/$/, "");

async function authenticatedRequest(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sessão Master indisponível. Entre novamente no sistema.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === "string"
      ? detail
      : detail?.mensagem || body?.message || `Falha HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

export function listProjectConsents(projectId) {
  return authenticatedRequest(`/api/v1/projetos/${projectId}/consentimentos`);
}

export function grantParticipantConsent(participantId, payload) {
  return authenticatedRequest(`/api/v1/participantes/${participantId}/consentimentos`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function revokeConsent(consentId) {
  return authenticatedRequest(`/api/v1/consentimentos/${consentId}/revogar`, {
    method: "POST"
  });
}
