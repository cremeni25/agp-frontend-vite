import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { tipo_usuario: "atletas" } }
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    navigate("/login/atletas");
  };

  return (
    <main className="agp-shell">
      <div className="agp-page auth-layout">
        <section className="auth-context">
          <div className="agp-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="agp-brand-mark">AGP</div>
            <div className="agp-brand-copy"><strong>AGP</strong><span>SPORTS INTELLIGENCE PLATFORM</span></div>
          </div>
          <span className="agp-eyebrow">Cadastro de atleta</span>
          <h1>Comece sua jornada no <span>AGP.</span></h1>
          <p>O cadastro público cria exclusivamente um perfil de atleta. Comissão Técnica, Clube e Master são liberados por autorização administrativa.</p>
        </section>

        <section className="agp-panel agp-form-card">
          <h1>Criar conta</h1>
          <p>Cadastre suas credenciais de atleta para iniciar o acesso à plataforma.</p>
          <form className="agp-form" onSubmit={handleRegister}>
            <div className="agp-field">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" className="agp-input" type="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </div>
            <div className="agp-field">
              <label htmlFor="register-password">Senha</label>
              <input id="register-password" className="agp-input" type="password" placeholder="Crie uma senha segura" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="new-password" minLength={6} required />
            </div>
            <div className="agp-alert" role="note">
              Perfil criado: Atleta. Outros níveis de acesso exigem vínculo e aprovação do administrador da plataforma.
            </div>
            {erro && <div className="agp-alert" role="alert">{erro}</div>}
            <button className="agp-button agp-button-primary" type="submit" disabled={loading}>{loading ? "Criando..." : "Criar conta de atleta"}</button>
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
