import { normalizeUserType, getDashboardPath } from "../config/accessProfiles";
import { supabase } from "../supabaseClient";

const OWNER_EMAIL = "anderson@cremeni.com.br";

export async function resolveUserAccess(sessionOrUser) {
  const user = sessionOrUser?.user || sessionOrUser;

  if (!user?.id) {
    return {
      user: null,
      perfil: null,
      userType: null,
      isOwner: false,
      dashboardPath: null,
      authorized: false
    };
  }

  const metadata = user.user_metadata || {};
  const email = user.email?.trim().toLowerCase() || "";

  const { data: perfil, error } = await supabase
    .from("perfis_atletas")
    .select("*")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao resolver perfil institucional:", error);
  }

  const profileType = normalizeUserType(
    perfil?.tipo_usuario || perfil?.funcao
  );
  const metadataType = normalizeUserType(
    metadata.tipo_usuario || metadata.funcao
  );
  const isOwner = metadata.is_owner === true || email === OWNER_EMAIL;
  const userType = profileType || metadataType || (isOwner ? "master" : null);

  const resolvedProfile = userType
    ? {
        ...(perfil || {}),
        auth_id: perfil?.auth_id || user.id,
        email: perfil?.email || user.email || null,
        tipo_usuario: perfil?.tipo_usuario || userType,
        tipo_usuario_normalizado: userType,
        is_owner: isOwner
      }
    : null;

  return {
    user,
    perfil: resolvedProfile,
    userType,
    isOwner,
    dashboardPath: getDashboardPath(userType),
    authorized: Boolean(userType)
  };
}
