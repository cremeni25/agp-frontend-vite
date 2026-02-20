import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    }
    checkUser();
  }, []);

  if (!user) return <h2>Usuário não autenticado</h2>;

  return (
    <div style={{ padding: 40 }}>
      <h1>AGP Sports Intelligence</h1>
      <p>Login funcionando ✅</p>
    </div>
  );
}
