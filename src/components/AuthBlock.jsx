// src/components/AuthBlock.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/auth-block.css";

export default function AuthBlock() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [age, setAge] = useState("");
  const [sexo, setSexo] = useState("");
  const [nivel, setNivel] = useState("");

  const [sports, setSports] = useState([]);
  const [modalidades, setModalidades] = useState([]);

  const [selectedSportId, setSelectedSportId] = useState("");
  const [selectedSportSlug, setSelectedSportSlug] = useState("");
  const [selectedModalidadeId, setSelectedModalidadeId] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState("");

  // ================= LOAD SPORTS =================
  useEffect(() => {
    async function loadSports() {
      const { data, error } = await supabase
        .from("esportes")
        .select("*")
        .order("nome");

      if (!error && data) {
        setSports(data);
      }
    }

    loadSports();
  }, []);

  // ================= LOAD MODALIDADES =================
  useEffect(() => {
    async function loadModalidades() {
      if (!selectedSportId) return;

      const { data, error } = await supabase
        .from("modalidades")
        .select("*")
        .eq("esporte_id", selectedSportId)
        .order("nome");

      if (!error && data) {
        setModalidades(data);
      }
    }

    loadModalidades();
  }, [selectedSportId]);

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

    const authId = data.user.id;

    const { error: insertError } = await supabase
      .from("perfis_atletas")
      .insert({
        auth_id: authId,
        nome: name,
        clube: club,
        idade: age ? parseInt(age) : null,
        sexo,
        nivel,
        esporte_id: selectedSportId,
        modalidade_id: selectedModalidadeId,
        esporte_slug: selectedSportSlug,
        funcao: "Atleta"
      });

    if (insertError) {
      setMsg("Erro ao criar perfil: " + insertError.message);
      return;
    }

    setMsg("Conta criada com sucesso. Faça login.");

    // Reset
    setMode("login");
    setName("");
    setClub("");
    setAge("");
    setSexo("");
    setNivel("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSelectedSportId("");
    setSelectedModalidadeId("");
    setSelectedSportSlug("");
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

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="eye" onClick={() => setShowPassword(!showPassword)}>👁</span>
          </div>

          <button type="submit" className="primary">Entrar</button>

          <button
            type="button"
            className="link"
            onClick={() => { setMode("signup"); setMsg(""); }}
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
            type="number"
            placeholder="Idade"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />

          <select value={sexo} onChange={(e) => setSexo(e.target.value)} required>
            <option value="">Sexo</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
          </select>

          <select value={nivel} onChange={(e) => setNivel(e.target.value)} required>
            <option value="">Nível</option>
            <option value="INICIANTE">Iniciante</option>
            <option value="INTERMEDIARIO">Intermediário</option>
            <option value="AVANCADO">Avançado</option>
          </select>

          <select
            value={selectedSportId}
            onChange={(e) => {
              const sport = sports.find(s => s.id === e.target.value);
              setSelectedSportId(e.target.value);
              setSelectedSportSlug(sport?.slug || "");
            }}
            required
          >
            <option value="">Esporte</option>
            {sports.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>

          <select
            value={selectedModalidadeId}
            onChange={(e) => setSelectedModalidadeId(e.target.value)}
            required
            disabled={!selectedSportId}
          >
            <option value="">Modalidade</option>
            {modalidades.map(m => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Criar senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="eye" onClick={() => setShowPassword(!showPassword)}>👁</span>
          </div>

          <div className="password-wrapper">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span className="eye" onClick={() => setShowConfirm(!showConfirm)}>👁</span>
          </div>

          <button type="submit" className="primary">Criar conta</button>

          <button
            type="button"
            className="link"
            onClick={() => { setMode("login"); setMsg(""); }}
          >
            Já tenho conta
          </button>

          {msg && <div className="msg">{msg}</div>}
        </form>
      )}
    </div>
  );
}
