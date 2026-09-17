import { supabase } from "../supabaseClient";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://performance-atleta-ai.onrender.com").replace(/\/$/, "");

async function request(path, options = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Não foi possível recuperar sua sessão.");
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão AGP não encontrada.");

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
    throw new Error(
      typeof detail === "string"
        ? detail
        : detail?.mensagem || detail?.message || `Falha HTTP ${response.status}`
    );
  }
  return body;
}

export const getDailySelfReport = (participantId) =>
  request(`/api/v1/participantes/${participantId}/autorreporte-diario`);

export const submitDailySelfReport = (participantId, payload) =>
  request(`/api/v1/participantes/${participantId}/autorreporte-diario`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const getCanonicalBaseline = (participantId) =>
  request(`/api/v1/participantes/${participantId}/linha-base-canonica`);

export const getLongitudinalIntelligence = (participantId) =>
  request(`/api/v1/participantes/${participantId}/inteligencia-longitudinal`);

export const getCanonicalAnalysis = (participantId) =>
  request(`/api/v1/participantes/${participantId}/analise-canonica`);

export const getCanonicalDecisionCycle = (participantId) =>
  request(`/api/v1/participantes/${participantId}/ciclo-decisao-canonico`);

export const createCanonicalDecision = (participantId, payload) =>
  request(`/api/v1/participantes/${participantId}/decisoes-canonicas`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const createCanonicalIntervention = (decisionId, payload) =>
  request(`/api/v1/decisoes-canonicas/${decisionId}/intervencoes`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const createCanonicalResponse = (interventionId, payload) =>
  request(`/api/v1/intervencoes/${interventionId}/respostas-canonicas`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const createCanonicalLearning = (responseId, payload) =>
  request(`/api/v1/respostas-intervencao/${responseId}/aprendizados`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const getTrainingCompetition = (participantId) =>
  request(`/api/v1/participantes/${participantId}/treino-competicao`);

export const getProfessionalAssessments = (participantId) =>
  request(`/api/v1/participantes/${participantId}/avaliacoes-profissionais-canonicas`);

export const createProfessionalAssessment = (participantId, payload) =>
  request(`/api/v1/participantes/${participantId}/avaliacoes-profissionais-canonicas`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const getIntegrativeAIContext = (participantId) =>
  request(`/api/v1/participantes/${participantId}/ia-integrativa/contexto`);

export async function getParticipantCanonicalBundle(participantId) {
  const calls = {
    readiness: getDailySelfReport(participantId),
    baseline: getCanonicalBaseline(participantId),
    longitudinal: getLongitudinalIntelligence(participantId),
    analysis: getCanonicalAnalysis(participantId),
    decision: getCanonicalDecisionCycle(participantId),
    training: getTrainingCompetition(participantId),
    assessments: getProfessionalAssessments(participantId)
  };

  const entries = Object.entries(calls);
  const settled = await Promise.allSettled(entries.map(([, promise]) => promise));
  const data = {};
  const unavailable = [];

  settled.forEach((item, index) => {
    const key = entries[index][0];
    if (item.status === "fulfilled") data[key] = item.value;
    else {
      data[key] = null;
      unavailable.push(key);
    }
  });

  return { ...data, unavailable };
}
