import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function DailyData({ user }) {
  const [peso, setPeso] = useState("");
  const [sono, setSono] = useState("");
  const [fadiga, setFadiga] = useState("");
  const [fc, setFc] = useState("");

  async function salvar(e) {
    e.preventDefault();

    await supabase.from("dados_biologicos").insert([
      {
        atleta_id: user.id,
        peso,
        qualidade_sono: sono,
        nivel_fadiga: fadiga,
        fc_repouso: fc
      }
    ]);

    alert("Dados salvos!");
  }

  return (
    <form onSubmit={salvar} style={{ padding: 40 }}>
      <h2>Registrar Dados</h2>

      <input value={peso} onChange={e => setPeso(e.target.value)} placeholder="Peso" />
      <input value={sono} onChange={e => setSono(e.target.value)} placeholder="Sono" />
      <input value={fadiga} onChange={e => setFadiga(e.target.value)} placeholder="Fadiga" />
      <input value={fc} onChange={e => setFc(e.target.value)} placeholder="FC Repouso" />

      <button type="submit">Salvar</button>
    </form>
  );
}
