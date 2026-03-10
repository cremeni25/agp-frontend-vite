import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Register() {

  const navigate = useNavigate();

  const [email,setEmail] = useState("");
  const [senha,setSenha] = useState("");
  const [tipo,setTipo] = useState("atletas");
  const [erro,setErro] = useState("");
  const [loading,setLoading] = useState(false);

  const handleRegister = async (e) => {

    e.preventDefault();
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({

      email: email,
      password: senha,

      options:{
        data:{
          tipo_usuario: tipo
        }
      }

    });

    if(error){

      setErro(error.message);
      setLoading(false);
      return;

    }

    navigate(`/login/${tipo}`);

  };

  return (

    <div className="register-container">

      <h2>Criar Conta</h2>

      <form onSubmit={handleRegister}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e)=>setSenha(e.target.value)}
          required
        />

        <select
          value={tipo}
          onChange={(e)=>setTipo(e.target.value)}
        >

          <option value="atletas">Atletas</option>
          <option value="comissao">Comissão Técnica</option>
          <option value="clubes">Clubes</option>
          <option value="master">Master</option>

        </select>

        <button type="submit" disabled={loading}>

          {loading ? "Criando..." : "Criar conta"}

        </button>

      </form>

      {erro && (
        <div style={{color:"red"}}>
          {erro}
        </div>
      )}

    </div>

  );

}
