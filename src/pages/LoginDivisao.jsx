import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginDivisao() {

  const { tipo } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {

      // 1️⃣ LOGIN SUPABASE
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
      });

      if (error) {
        setErro("Email ou senha inválidos.");
        return;
      }

      const user = data.user;

      // 2️⃣ BUSCAR PERFIL DO USUÁRIO
      const { data: perfil, error: perfilErro } = await supabase
        .from("perfis_atletas")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (perfilErro || !perfil) {
        setErro("Perfil não encontrado.");
        return;
      }

      const tipoUsuario = perfil.tipo_usuario;

      // 3️⃣ VALIDAR SE A DIVISÃO ACESSADA É CORRETA
      if (tipoUsuario !== tipo) {
        setErro("Você não tem acesso a esta divisão.");
        await supabase.auth.signOut();
        return;
      }

      // 4️⃣ REDIRECIONAMENTO SEGURO
      if (tipoUsuario === "atletas") {
        navigate("/dashboard-atleta");
      }

      if (tipoUsuario === "comissao") {
        navigate("/dashboard-comissao");
      }

      if (tipoUsuario === "clubes") {
        navigate("/dashboard-clubes");
      }

      if (tipoUsuario === "master") {
        navigate("/dashboard-master");
      }

    } catch (err) {
      setErro("Erro inesperado no login.");
    }
  };

  return (
    <div className="login-container">

      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        {tipo === "atletas" && "Atletas"}
        {tipo === "comissao" && "Comissão Técnica"}
        {tipo === "clubes" && "Clubes & Associações"}
        {tipo === "master" && "Master"}
      </h2>

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button type="submit">
          Entrar
        </button>

      </form>

      {erro && (
        <div style={{ color: "red", marginTop: "10px" }}>
          {erro}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px"
        }}
      >

        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/register")}
        >
          Criar conta
        </span>

        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/divisao")}
        >
          Voltar
        </span>

      </div>

    </div>
  );
}
