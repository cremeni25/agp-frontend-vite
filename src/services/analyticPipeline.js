import { supabase } from "../supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão Master não encontrada.");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail || body));
  return body;
}

export const listProjectExecutions = (projectId) => request(`/api/v1/projetos/${projectId}/execucoes-analiticas`);
export const executeAnalysis = (payload) => request("/api/v1/execucoes-analiticas", { method: "POST", body: JSON.stringify(payload) });
