import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function entrar(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  }

  async function cadastrar() {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("Usuário criado com sucesso. Faça login.");
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
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <button style={{ width: "100%", marginBottom: 10 }}>
          Entrar
        </button>

        <button
          type="button"
          onClick={cadastrar}
          style={{ width: "100%" }}
        >
          Criar Conta
        </button>

        <p style={{ marginTop: 12 }}>{msg}</p>
      </form>
    </div>
  );
}
