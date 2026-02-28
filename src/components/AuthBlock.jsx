// src/components/AuthBlock.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/auth-block.css";

export default function AuthBlock() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [msg, setMsg] = useState("");

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

    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    if (!perfil) {
      setMsg("Perfil não encontrado.");
      return;
    }

    window.location.href = `/dashboard-${perfil.role}`;
  }

  async function cadastrar(e) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    await supabase.from("perfis").insert({
      user_id: data.user.id,
      nome: name,
      clube: club,
      role: "athlete"
    });

    setMode("login");
    setMsg("Cadastro criado. Faça login.");
  }

  return (
    <div className="auth-block">
      {mode === "login" ? (
        <form onSubmit={entrar}>
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

          <button
            type="button"
            className="link"
            onClick={() => setMode("signup")}
          >
            Criar conta
          </button>
        </form>
      ) : (
        <form onSubmit={cadastrar}>
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Clube"
            value={club}
            onChange={e => setClub(e.target.value)}
          />

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

          <button type="submit">Cadastrar</button>

          <button
            type="button"
            className="link"
            onClick={() => setMode("login")}
          >
            Já tenho conta
          </button>
        </form>
      )}

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
