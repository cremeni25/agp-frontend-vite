// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/home.css";

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
    <div className="home-container">
      {/* MESMO background institucional da Home */}
      <div className="home-background institutional" />

      {/* Overlay */}
      <div className="home-overlay" />

      {/* Conteúdo */}
      <div className="home-content">
        <h2 className="home-title">AGP</h2>

        <form
          onSubmit={entrar}
          style={{ width: 320, marginTop: "1rem" }}
        >
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

          <button
            className="home-button"
            style={{ width: "100%", marginBottom: 10 }}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={cadastrar}
            className="home-button"
            style={{ width: "100%", background: "#334155" }}
          >
            Criar conta
          </button>

          {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
        </form>
      </div>
    </div>
  );
}
