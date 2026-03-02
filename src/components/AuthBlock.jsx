// src/components/AuthBlock.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/auth-block.css";

export default function AuthBlock() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [club, setClub] = useState("");

  const [msg, setMsg] = useState("");

  // ================= LOGIN =================
  async function handleLogin(e) {
    e.preventDefault();
    setMsg("🔎 Tentando login...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMsg("❌ Login erro: " + error.message);
      return;
    }

    if (!data.user) {
      setMsg("❌ Login retornou sem user.");
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("perfis_atletas")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (perfilError) {
      setMsg("❌ Erro ao buscar perfil: " + perfilError.message);
      return;
    }

    if (!perfil) {
      setMsg("❌ Perfil não encontrado para auth_id: " + data.user.id);
      return;
    }

    setMsg("✅ Login OK — Perfil encontrado.");
    window.location.href = "/dashboard-atleta";
  }

  // ================= SIGNUP =================
  async function handleSignup(e) {
    e.preventDefault();
    setMsg("🔎 Criando usuário...");

    if (password !== confirmPassword) {
      setMsg("❌ Senhas não coincidem.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setMsg("❌ Signup erro: " + error.message);
      return;
    }

    if (!data.user) {
      setMsg("❌ Signup retornou sem user.");
      return;
    }

    setMsg("🔎 Fazendo login automático...");

    // força login após signup
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (loginError) {
      setMsg("❌ Login automático falhou: " + loginError.message);
      return;
    }

    if (!loginData.user) {
      setMsg("❌ Login automático retornou sem user.");
      return;
    }

    setMsg("🔎 Inserindo perfil...");

    const { data: insertData, error: insertError } = await supabase
      .from("perfis_atletas")
      .insert({
        auth_id: loginData.user.id,
        nome: name,
        clube: club,
        funcao: "Atleta"
      })
      .select();

    if (insertError) {
      setMsg("❌ Erro no INSERT: " + insertError.message);
      return;
    }

    if (!insertData) {
      setMsg("❌ Insert não retornou dados.");
      return;
    }

    setMsg("✅ Perfil criado com sucesso. Faça login.");
    setMode("login");
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
