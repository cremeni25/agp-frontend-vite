import { supabase } from "../supabaseClient";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com").replace(/\/$/, "");

function formatApiError(body, status) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.mensagem) return detail.mensagem;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      const field = Array.isArray(item?.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
      const message = item?.msg || "valor inválido";
      return field ? `${field}: ${message}` : message;
    }).filter(Boolean);
    if (messages.length) return messages.join(" | ");
  }
  return `Falha HTTP ${status}`;
}

async function authorizedRequest(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Falha ao recuperar sessão: ${error.message}`);
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão Master não encontrada.");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(formatApiError(body, response.status));
  return body;
}

export const listProjects = () => authorizedRequest("/api/v1/administracao/projetos");
export const createProject = (payload) => authorizedRequest("/api/v1/administracao/projetos", { method: "POST", body: JSON.stringify(payload) });
export const updateProject = (id, payload) => authorizedRequest(`/api/v1/administracao/projetos/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteProject = (id) => authorizedRequest(`/api/v1/administracao/projetos/${id}`, { method: "DELETE" });
