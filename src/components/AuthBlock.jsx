// src/components/AuthBlock.jsx

import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/auth-block.css";

export default function AuthBlock() {
  const [isRegistering, setIsRegistering] = useState(false);

  const [nome, setNome] = useState("");
  const [clube, setClube] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [msg, setMsg] = useState("");

  // ===============================
  // LOGIN
  // ===============================
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
      .from("perfis_atletas")
      .select("funcao")
      .eq("auth_id", data.user.id)
      .single();

    if (!perfil) {
      window.location.href = "/onboarding";
      return;
    }

    switch (perfil.funcao) {
      case "Atleta":
        window.location.href = "/dashboard-atleta";
        break;
      case "Gestor":
        window.location.href = "/dashboard-master";
        break;
      case "Comissao":
        window.location.href = "/dashboard-comissao";
        break;
      case "Clube":
        window.location.href = "/dashboard-clube";
        break;
      default:
        window.location.href = "/onboarding";
    }
  }

  // ===============================
  // REGISTRO
  // ===============================
  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");

    if (password !== confirmPassword) {
      setMsg("As senhas não coincidem.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    const userId = data.user.id;

    const { error: perfilError } = await supabase
      .from("perfis_atletas")
      .insert([
        {
          auth_id: userId,
          nome: nome,
          clube: clube,
          funcao: "Atleta",
        },
      ]);

    if (perfilError) {
      setMsg("Erro ao criar perfil.");
      return;
    }

    // 🔥 LIMPA CAMPOS
    setNome("");
    setClube("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setIsRegistering(false);
    setMsg("Cadastro realizado com sucesso. Faça login.");
  }

  return (
    <div className="auth-block">
      {!isRegistering ? (
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

          <button type="submit">Entrar</button>

          <span
            className="auth-link"
            onClick={() => {
              setMsg("");
              setIsRegistering(true);
            }}
          >
            Criar conta
          </span>

          {msg && <p className="auth-msg">{msg}</p>}
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Clube ou Associação"
            value={clube}
            onChange={(e) => setClube(e.target.value)}
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
            placeholder="Senha"
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

          <button type="submit">Cadastrar</button>

          <span
            className="auth-link"
            onClick={() => {
              setMsg("");
              setIsRegistering(false);
            }}
          >
            Já tenho conta
          </span>

          {msg && <p className="auth-msg">{msg}</p>}
        </form>
      )}
    </div>
  );
}
