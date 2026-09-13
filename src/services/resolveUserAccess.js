import { normalizeUserType, getDashboardPath } from "../config/accessProfiles";
import { supabase } from "../supabaseClient";

const OWNER_EMAIL = "anderson@cremeni.com.br";

function emptyAccess() {
  return {
    user: null,
    perfil: null,
    userType: null,
    isOwner: false,
    dashboardPath: null,
    authorized: false
  };
}

async function resolveCanonicalProfile(user) {
  const { data: conta, error: contaError } = await supabase
    .from("agp_contas_acesso")
    .select("id,pessoa_id,auth_id,status")
    .eq("auth_id", user.id)
    .eq("status", "ativo")
    .maybeSingle();

  if (contaError) throw contaError;
  if (!conta?.pessoa_id) return null;

  const { data: pessoa, error: pessoaError } = await supabase
    .from("agp_pessoas")
    .select("id,nome")
    .eq("id", conta.pessoa_id)
    .maybeSingle();

  if (pessoaError) throw pessoaError;

  const { data: participantes, error: participanteError } = await supabase
    .from("agp_participantes_projeto")
    .select("id,pessoa_id,projeto_id,funcao_no_projeto,status_onboarding,ativo")
    .eq("pessoa_id", conta.pessoa_id)
    .eq("ativo", true);

  if (participanteError) throw participanteError;

  const participante =
    participantes?.find((item) => item.funcao_no_projeto === "atleta") ||
    participantes?.[0] ||
    null;

  let perfilEsportivo = null;
  if (participante?.funcao_no_projeto === "atleta") {
    const { data, error } = await supabase
      .from("agp_perfis_esportivos")
      .select("id,pessoa_id,legacy_perfil_atleta_id")
      .eq("pessoa_id", conta.pessoa_id)
      .maybeSingle();

    if (error) throw error;
    perfilEsportivo = data;
  }

  return {
    id: perfilEsportivo?.legacy_perfil_atleta_id || perfilEsportivo?.id || conta.pessoa_id,
    pessoa_id: conta.pessoa_id,
    conta_acesso_id: conta.id,
    perfil_esportivo_id: perfilEsportivo?.id || null,
    legacy_perfil_atleta_id: perfilEsportivo?.legacy_perfil_atleta_id || null,
    participante_id: participante?.id || null,
    projeto_id: participante?.projeto_id || null,
    nome: pessoa?.nome || user.email || "Participante AGP",
    auth_id: user.id,
    email: user.email || null,
    funcao: participante?.funcao_no_projeto || null,
    tipo_usuario: participante?.funcao_no_projeto || null,
    status_onboarding: participante?.status_onboarding || null,
    identidade_canonica: true
  };
}

async function resolveLegacyProfile(user) {
  const { data, error } = await supabase
    .from("perfis_atletas")
    .select("*")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function resolveUserAccess(sessionOrUser) {
  const user = sessionOrUser?.user || sessionOrUser;

  if (!user?.id) return emptyAccess();

  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};
  const email = user.email?.trim().toLowerCase() || "";
  const isOwner =
    email === OWNER_EMAIL ||
    metadata.is_owner === true ||
    appMetadata.is_owner === true;

  let perfil = null;

  try {
    perfil = await resolveCanonicalProfile(user);

    // Compatibilidade temporária: perfis ainda não migrados continuam acessíveis,
    // mas a identidade canônica AGP sempre tem precedência.
    if (!perfil) perfil = await resolveLegacyProfile(user);
  } catch (error) {
    console.error("Erro ao resolver identidade AGP:", error);
  }

  const profileType = normalizeUserType(perfil?.tipo_usuario || perfil?.funcao);
  const metadataType = normalizeUserType(
    metadata.tipo_usuario ||
      metadata.funcao ||
      appMetadata.tipo_usuario ||
      appMetadata.funcao
  );

  const userType = isOwner ? "master" : profileType || metadataType || null;
  const dashboardPath = getDashboardPath(userType);

  const resolvedProfile = userType
    ? {
        ...(perfil || {}),
        auth_id: perfil?.auth_id || user.id,
        email: perfil?.email || user.email || null,
        tipo_usuario: userType,
        tipo_usuario_normalizado: userType,
        is_owner: isOwner
      }
    : null;

  return {
    user,
    perfil: resolvedProfile,
    userType,
    isOwner,
    dashboardPath,
    authorized: Boolean(userType && dashboardPath)
  };
}
