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
  // REGISTRO
  // ===============================
  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");

    if (password !== confirmPassword) {
      setMsg("As senhas não coincidem.");
      return;
    }

    console.log("INICIANDO SIGNUP...");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("RETORNO SIGNUP:", data);
    console.log("ERRO SIGNUP:", error);

    if (error) {
      setMsg("Erro signup: " + error.message);
      return;
    }

    if (!data.user) {
      setMsg("Usuário não retornado pelo signup.");
      return;
    }

    const userId = data.user.id;
    console.log("USER ID:", userId);

    console.log("INICIANDO INSERT PERFIL...");

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

    console.log("ERRO INSERT:", perfilError);

    if (perfilError) {
      setMsg("Erro insert perfil: " + perfilError.message);
      return;
    }

    setMsg("Cadastro completo com sucesso.");
  }

  return (
    <div className="auth-block">
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

        {msg && <p className="auth-msg">{msg}</p>}
      </form>
    </div>
  );
}
