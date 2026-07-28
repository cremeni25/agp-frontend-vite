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
    const { data, error } = await supabase
      .from("perfis_atletas")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao resolver perfil institucional:", error);
    } else {
      perfil = data;
    }
  } catch (error) {
    console.error("Falha inesperada ao resolver perfil institucional:", error);
  }

  const profileType = normalizeUserType(
    perfil?.tipo_usuario || perfil?.funcao
  );
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
