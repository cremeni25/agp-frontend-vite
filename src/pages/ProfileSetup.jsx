import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileSetup() {
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [clube, setClube] = useState("");
  const [esporte, setEsporte] = useState("");
  const [idade, setIdade] = useState("");
  const [msg, setMsg] = useState("");

  async function salvarPerfil(e) {
    e.preventDefault();

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      setMsg("Sessão não encontrada.");
      return;
    }

    const userId = session.user.id;

    const { error } = await supabase
      .from("perfis_atletas")
      .insert([
        {
          auth_id: userId,
          nome,
          funcao,
          clube,
          esporte,
          idade
        }
      ]);

    if (error) {
      setMsg(error.message);
    } else {
      window.location.reload();
    }
  }

  return (
    <div style={{
      background: "#0f172a",
      color: "white",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <form onSubmit={salvarPerfil} style={{ width: 320 }}>
        <h2>Completar Perfil</h2>

        <input placeholder="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <select
          value={funcao}
          onChange={e => setFuncao(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          <option value="">Função</option>
          <option>Atleta</option>
          <option>Técnico</option>
          <option>Preparador Físico</option>
          <option>Nutricionista</option>
          <option>Psicólogo</option>
          <option>Gestor</option>
        </select>

        <input placeholder="Clube"
          value={clube}
          onChange={e => setClube(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input placeholder="Esporte"
          value={esporte}
          onChange={e => setEsporte(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input type="number" placeholder="Idade"
          value={idade}
          onChange={e => setIdade(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button type="submit" style={{ width: "100%" }}>
          Salvar Perfil
        </button>

        <p>{msg}</p>
      </form>
    </div>
  );
}
