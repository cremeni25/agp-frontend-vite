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
    setMsg("Entrando...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMsg("Erro no login: " + error.message);
      return;
    }

    if (!data.user) {
      setMsg("Usuário não retornado no login.");
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("perfis_atletas")
      .select("*")
      .eq("auth_id", data.user.id)
      .maybeSingle();

    if (perfilError) {
      setMsg("Erro ao buscar perfil: " + perfilError.message);
      return;
    }

    if (!perfil) {
      setMsg("Perfil não encontrado.");
      return;
    }

    window.location.href = "/dashboard-atleta";
  }

  // ================= SIGNUP =================
  async function handleSignup(e) {
    e.preventDefault();
    setMsg("Criando conta...");

    if (password !== confirmPassword) {
      setMsg("Senhas não coincidem.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setMsg("Erro no cadastro: " + error.message);
      return;
    }

    if (!data.user) {
      setMsg("Usuário criado, mas ID não retornado.");
      return;
    }

    const authId = data.user.id;

    const { error: insertError } = await supabase
      .from("perfis_atletas")
      .insert({
        auth_id: authId,
        nome: name,
        clube: club,
        funcao: "Atleta"
      });

    if (insertError) {
      setMsg("Erro ao criar perfil: " + insertError.message);
      return;
    }

    setMsg("Conta criada com sucesso. Faça login.");

    setMode("login");
    setName("");
    setClub("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
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
