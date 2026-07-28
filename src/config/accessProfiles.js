export const ACCESS_PROFILES = {
  atleta: {
    routeParam: "atletas",
    aliases: ["atleta", "atletas", "athlete"],
    label: "Atletas",
    dashboardPath: "/dashboard-atleta"
  },
  comissao: {
    routeParam: "comissao",
    aliases: ["comissao", "comissão", "comissao_tecnica", "comissão técnica", "tecnico", "técnico", "coach"],
    label: "Comissão Técnica",
    dashboardPath: "/dashboard-comissao"
  },
  clube: {
    routeParam: "clubes",
    aliases: ["clube", "clubes", "associacao", "associação", "instituicao", "instituição"],
    label: "Clubes & Associações",
    dashboardPath: "/dashboard-clube"
  },
  master: {
    routeParam: "master",
    aliases: ["master", "owner", "proprietario", "proprietário", "admin", "administrador", "administradora"],
    label: "Master",
    dashboardPath: "/dashboard-master"
  }
};

export function normalizeUserType(value) {
  if (!value) return null;
  const normalizedValue = String(value).trim().toLowerCase();
  return (
    Object.entries(ACCESS_PROFILES).find(([, profile]) =>
      profile.aliases.includes(normalizedValue)
    )?.[0] || null
  );
}

export function getProfileByRouteParam(routeParam) {
  return Object.entries(ACCESS_PROFILES).find(
    ([, profile]) => profile.routeParam === routeParam
  ) || null;
}

export function getDashboardPath(userType) {
  const normalizedType = normalizeUserType(userType);
  return normalizedType ? ACCESS_PROFILES[normalizedType].dashboardPath : null;
}
