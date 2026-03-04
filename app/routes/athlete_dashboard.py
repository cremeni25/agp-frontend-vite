from fastapi import APIRouter, Depends, HTTPException
from app.supabase_client import supabase

router = APIRouter(prefix="/api/athlete", tags=["Athlete"])

@router.get("/dashboard")
def get_dashboard(user_id: str):

    # 1️⃣ Perfil
    perfil = supabase.table("perfis_atletas") \
        .select("*") \
        .eq("id", user_id) \
        .single() \
        .execute()

    if not perfil.data:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    # 2️⃣ Score
    score = supabase.table("score_atleta") \
        .select("*") \
        .eq("atleta_id", user_id) \
        .execute()

    # 3️⃣ Carga
    carga = supabase.table("carga_treinamento_atleta") \
        .select("*") \
        .eq("atleta_id", user_id) \
        .execute()

    # 4️⃣ Sono
    sono = supabase.table("sono_atleta") \
        .select("*") \
        .eq("atleta_id", user_id) \
        .execute()

    return {
        "athlete": perfil.data,
        "score": score.data,
        "carga": carga.data,
        "sono": sono.data
    }
