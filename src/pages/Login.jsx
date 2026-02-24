import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function entrar(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("Verifique seu email para acessar o AGP.");
    }
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0f172a",
      color: "white"
    }}>
      <form onSubmit={entrar} style={{ width: 320 }}>
        <h2>AGP Sports Intelligence</h2>

        <input
          placeholder="Digite seu email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <button style={{ width: "100%" }}>
          Entrar
        </button>

        <p style={{ marginTop: 12 }}>{msg}</p>
      </form>
    </div>
  );
}
