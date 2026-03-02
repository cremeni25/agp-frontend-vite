// src/components/AuthBlock.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/auth-block.css";

export default function AuthBlock() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  function resetFields() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMsg("");
  }

  // ===== LOGIN =====
  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    if (!perfil) {
      window.location.href = "/onboarding";
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
        window.location.href = "/onboarding";
    }
  }

  // ===== SIGNUP =====
  async function handleSignup(e) {
    e.preventDefault();
    setMsg("");

    if (password !== confirmPassword) {
      setMsg("As senhas não coincidem.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    resetFields();
    setMode("login");
    setMsg("Conta criada com sucesso. Faça login.");
  }

  return (
    <div className="auth-block">
      {mode === "login" ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="primary">
            Entrar
          </button>

          <button
            type="button"
            className="link"
            onClick={() => {
              resetFields();
              setMode("signup");
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
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Criar senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" className="primary">
            Criar conta
          </button>

          <button
            type="button"
            className="link"
            onClick={() => {
              resetFields();
              setMode("login");
            }}
          >
            Já tenho conta
          </button>

          {msg && <div className="msg">{msg}</div>}
        </form>
      )}
    </div>
  );
}
