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

  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === "string" ? detail : detail?.mensagem || `Falha HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

export function listTechnicalTeam() {
  return authorizedRequest("/api/v1/administracao/equipe-tecnica");
}

export function listCanonicalTechnicalTeam() {
  return authorizedRequest("/api/v1/administracao/equipe-tecnica/canonicos");
}

export function listAuthenticatedUsers() {
  return authorizedRequest("/api/v1/administracao/equipe-tecnica/usuarios");
}

// Compatibilidade com a página da Equipe Técnica já publicada.
export function listTechnicalUsers() {
  return listAuthenticatedUsers();
}

export function createTechnicalMember(payload) {
  return authorizedRequest("/api/v1/administracao/equipe-tecnica", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTechnicalMember(memberId, payload) {
  return authorizedRequest(`/api/v1/administracao/equipe-tecnica/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteTechnicalMember(memberId) {
  return authorizedRequest(`/api/v1/administracao/equipe-tecnica/${memberId}`, {
    method: "DELETE"
  });
}
