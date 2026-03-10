import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function SessionGuard({ children }) {

  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {

    if (!loading && !session) {
      navigate("/divisao");
    }

  }, [session, loading, navigate]);

  if (loading) return null;

  return children;

}
