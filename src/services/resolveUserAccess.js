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

async function claimPendingCanonicalAccount(user) {
  const email = user.email?.trim().toLowerCase();
  if (!email || !user.email_confirmed_at) return null;

  const { data: pending, error: pendingError } = await supabase
    .from("agp_contas_acesso")
    .select("id,pessoa_id,email_acesso,status")
    .is("auth_id", null)
    .eq("status", "acesso_pendente")
    .ilike("email_acesso", email)
    .maybeSingle();

  if (pendingError) throw pendingError;
  if (!pending?.id) return null;

  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("agp_contas_acesso")
    .update({
      auth_id: user.id,
      status: "ativo",
      primeiro_acesso_em: now,
      ultimo_acesso_em: now,
      updated_at: now
    })
    .eq("id", pending.id)
    .is("auth_id", null)
    .eq("status", "acesso_pendente")
    .select("id,pessoa_id,auth_id,status")
    .maybeSingle();

  if (claimError) throw claimError;
  return claimed || null;
}

async function activateInvitedCanonicalAccount(user, account) {
  if (!account?.id || account.status !== "acesso_pendente" || !user.email_confirmed_at) return account;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("agp_contas_acesso")
    .update({
      status: "ativo",
      primeiro_acesso_em: now,
      ultimo_acesso_em: now,
      updated_at: now
    })
    .eq("id", account.id)
    .eq("auth_id", user.id)
    .eq("status", "acesso_pendente")
    .select("id,pessoa_id,auth_id,status")
    .maybeSingle();

  if (error) throw error;
  return data || account;
}

async function resolveCanonicalProfile(user) {
  let { data: conta, error: contaError } = await supabase
    .from("agp_contas_acesso")
    .select("id,pessoa_id,auth_id,status")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (contaError) throw contaError;

  if (conta?.status === "acesso_pendente") {
    conta = await activateInvitedCanonicalAccount(user, conta);
  }

  if (!conta?.pessoa_id) {
    conta = await claimPendingCanonicalAccount(user);
  }

  if (!conta?.pessoa_id || conta.status !== "ativo") return null;

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
      .select("id,pessoa_id,legacy_perfil_atleta_id,modalidade,categoria,nivel,status_federativo,federacao_nome,registro_federativo")
      .eq("pessoa_id", conta.pessoa_id)
      .maybeSingle();

    if (error) throw error;
    perfilEsportivo = data;
  }

  const now = new Date().toISOString();
  await supabase
    .from("agp_contas_acesso")
    .update({ ultimo_acesso_em: now, updated_at: now })
    .eq("id", conta.id)
    .eq("auth_id", user.id);

  return {
    id: perfilEsportivo?.legacy_perfil_atleta_id || perfilEsportivo?.id || conta.pessoa_id,
    pessoa_id: conta.pessoa_id,
    conta_acesso_id: conta.id,
    perfil_esportivo_id: perfilEsportivo?.id || null,
    legacy_perfil_atleta_id: perfilEsportivo?.legacy_perfil_atleta_id || null,
    modalidade: perfilEsportivo?.modalidade || null,
    categoria: perfilEsportivo?.categoria || null,
    nivel: perfilEsportivo?.nivel || null,
    status_federativo: perfilEsportivo?.status_federativo || "nao_informado",
    federacao_nome: perfilEsportivo?.federacao_nome || null,
    registro_federativo: perfilEsportivo?.registro_federativo || null,
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
