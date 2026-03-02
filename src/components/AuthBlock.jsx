// src/components/AuthBlock.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/auth-block.css";

export default function AuthBlock() {
  const [mode, setMode] = useState("login"); // login | signup

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [club, setClub] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [msg, setMsg] = useState("");

  // ================= LOGIN =================
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

    // Buscar perfil corretamente na tabela real
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis_atletas")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (perfilError || !perfil) {
      setMsg("Perfil não encontrado.");
      return;
    }

    // Redirecionamento simples (mantendo sua arquitetura atual)
    window.location.href = "/dashboard-atleta";
  }

  // ================= SIGNUP =================
  async function handleSignup(e) {
    e.preventDefault();
    setMsg("");

    if (password !== confirmPassword) {
      setMsg("As senhas não coincidem.");
      return;
    }

    // Criar usuário na AUTH
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    if (!data.user) {
      setMsg("Erro ao criar usuário.");
      return;
    }

    // Criar perfil na tabela correta
    const { error: perfilError } = await supabase
      .from("perfis_atletas")
      .insert({
        auth_id: data.user.id,
        nome: name,
        clube: club,
        funcao: "Atleta"
      });

    if (perfilError) {
      setMsg("Usuário criado, mas erro ao criar perfil.");
      return;
    }

    // Limpar campos após cadastro
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setClub("");

    setMode("login");
    setMsg("Cadastro realizado com sucesso. Faça login.");
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

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>

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
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Clube / Associação"
            value={club}
            onChange={(e) => setClub(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Criar senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>

          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              👁
            </span>
          </div>

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
            Já tenho conta
          </button>

          {msg && <div className="msg">{msg}</div>}
        </form>
      )}
    </div>
  );
}
