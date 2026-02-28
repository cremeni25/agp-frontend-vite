// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import ProfileSelect from "./ProfileSelect";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [logged, setLogged] = useState(false);

  async function entrar(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
    } else {
      setLogged(true);
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

  if (logged) {
    return <ProfileSelect />;
  }

  return (
    <form className="login-box" onSubmit={entrar}>
      <h2 className="login-title">Acesso ao sistema</h2>

      <input
        className="login-input"
        placeholder="E-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className="login-input"
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button className="login-button">Entrar</button>

      <button
        type="button"
        className="login-link"
        onClick={cadastrar}
      >
        Criar conta
      </button>

      {msg && <p className="login-msg">{msg}</p>}
    </form>
  );
}
