import { supabase } from "../supabaseClient";

const API_URL = (import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com").replace(/\/$/, "");

async function request(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sessão Master indisponível.");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}`, ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof payload?.detail === "string" ? payload.detail : JSON.stringify(payload?.detail || payload || {}));
  return payload;
}

export const listProtocols = () => request("/api/v1/catalogo/protocolos");
export const createProtocol = (payload) => request("/api/v1/catalogo/protocolos", { method: "POST", body: JSON.stringify(payload) });
export const createInstrument = (payload) => request("/api/v1/catalogo/instrumentos", { method: "POST", body: JSON.stringify(payload) });
export const activateInstrument = (payload) => request("/api/v1/catalogo/ativacoes", { method: "POST", body: JSON.stringify(payload) });
export const listProjectCatalog = (projectId) => request(`/api/v1/projetos/${projectId}/catalogo-instrumentos`);
