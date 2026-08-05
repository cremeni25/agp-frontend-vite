import { supabase } from "../supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão administrativa não encontrada.");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail?.message || payload?.detail || "Falha na validação profissional.");
  return payload;
}

export const listProfessionalResults = (projectId) => request(`/api/v1/projetos/${projectId}/resultados-profissionais`);
export const validateProfessionalResult = (resultId, payload) => request(`/api/v1/resultados/${resultId}/validacoes`, { method: "POST", body: JSON.stringify(payload) });
export const listResultValidations = (resultId) => request(`/api/v1/resultados/${resultId}/validacoes`);
