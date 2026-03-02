// src/components/AuthBlock.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/auth-block.css";

export default function AuthBlock() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

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

  async function handleSignup(e) {
    e.preventDefault();
    setMsg("");

    if (password !== confirm) {
      setMsg("As senhas não coincidem.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
    } else {
      setMode("login");
      setMsg("Conta criada. Faça login para continuar.");
    }
  }

  return (
    <div className="auth-block">
      {mode === "login" ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="primary">
            Entrar
          </button>

          <button
            type="button"
            className="link"
            onClick={() => {
              setMode("signup");
              setMsg("");
            }}
          >
            Criar conta
          </button>

          {msg && <div className="msg">{msg}</div>}
        </form>
      ) : (
        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Criar senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />

          <button type="submit" className="primary">
            Criar conta
          </button>

          <button
            type="button"
            className="link"
            onClick={() => {
              setMode("login");
              setMsg("");
            }}
          >
            Voltar
          </button>

          {msg && <div className="msg">{msg}</div>}
        </form>
      )}
    </div>
  );
}
