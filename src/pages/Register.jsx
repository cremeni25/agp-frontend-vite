import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("atletas");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { tipo_usuario: tipo } }
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    navigate(`/login/${tipo}`);
  };

  return (
    <main className="agp-shell">
      <div className="agp-page auth-layout">
        <section className="auth-context">
          <div className="agp-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy"><strong>AGP</strong><span>SPORTS INTELLIGENCE PLATFORM</span></div>
          </div>
          <span className="agp-eyebrow">Novo acesso</span>
          <h1>Comece sua jornada no <span>AGP.</span></h1>
          <p>Crie um acesso inicial. Os módulos e permissões serão definidos conforme a divisão selecionada.</p>
        </section>

        <section className="agp-panel agp-form-card">
          <h1>Criar conta</h1>
          <p>Preencha seus dados de acesso à plataforma.</p>
          <form className="agp-form" onSubmit={handleRegister}>
            <div className="agp-field">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" className="agp-input" type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="agp-field">
              <label htmlFor="register-password">Senha</label>
              <input id="register-password" className="agp-input" type="password" placeholder="Crie uma senha segura" value={senha} onChange={(event) => setSenha(event.target.value)} minLength={6} required />
            </div>
            <div className="agp-field">
              <label htmlFor="register-profile">Divisão</label>
              <select id="register-profile" className="agp-select" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                <option value="atletas">Atletas</option>
                <option value="comissao">Comissão Técnica</option>
                <option value="clubes">Clubes & Associações</option>
                <option value="master">Master</option>
              </select>
            </div>
            {erro && <div className="agp-alert" role="alert">{erro}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Criando..." : "Criar acesso"}</button>
          </form>
          <div className="agp-link-row">
            <span className="agp-link" onClick={() => navigate("/divisao")}>Já tenho acesso</span>
            <span className="agp-link" onClick={() => navigate("/")}>Voltar ao início</span>
          </div>
        </section>
      </div>
    </main>
  );
}
