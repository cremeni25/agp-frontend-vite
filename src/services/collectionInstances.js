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
    throw new Error(typeof detail === "string" ? detail : detail?.mensagem || JSON.stringify(detail || payload || {}));
  }
  return payload;
}

export const listProjectCollections = (projectId) => authorizedRequest(`/api/v1/projetos/${projectId}/coletas`);
export const createCollection = (payload) => authorizedRequest("/api/v1/coletas", { method: "POST", body: JSON.stringify(payload) });
export const updateCollection = (collectionId, payload) => authorizedRequest(`/api/v1/coletas/${collectionId}`, { method: "PATCH", body: JSON.stringify(payload) });
export const listCollectionVersions = (collectionId) => authorizedRequest(`/api/v1/coletas/${collectionId}/versoes`);
