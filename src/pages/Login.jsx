// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import ProfileSelect from "./ProfileSelect";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [logged, setLogged] = useState(false);

  async function entrar(e) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    const userId = data.user.id;

    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (perfilError || !perfil) {
      setMsg("Perfil não encontrado para este usuário.");
      return;
    }

    switch (perfil.role) {
      case "athlete":
        window.location.href = "/dashboard-atleta";
        break;
      case "coach":
        window.location.href = "/dashboard-comissao";
        break;
      case "club":
        window.location.href = "/dashboard-clube";
        break;
      case "master":
        window.location.href = "/dashboard-master";
        break;
      default:
        setMsg("Perfil inválido.");
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
      setLogged(true);
    }
  }

  if (logged) {
    return <ProfileSelect />;
  }

  return (
    <div className="login-container">
      <div className="login-overlay">
        <form onSubmit={entrar} className="login-box">
          <h2>AGP</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button type="submit">Entrar</button>

          <button type="button" onClick={cadastrar}>
            Criar conta
          </button>

          {msg && <p>{msg}</p>}
        </form>
      </div>
    </div>
  );
}
