/* Estrutura base */
.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Background institucional */
.home-background {
  position: absolute;
  inset: 0;
  background-image: url("/home-background.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

/* Overlay */
.home-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(5, 15, 35, 0.65),
    rgba(2, 6, 18, 0.9)
  );
  backdrop-filter: blur(2px);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Conteúdo */
.home-content {
  text-align: center;
  color: #eaf6ff;
  max-width: 720px;
  padding: 24px;
}

/* Logo */
.logo-agp {
  font-family: 'Orbitron', 'Rajdhani', sans-serif;
  font-size: clamp(48px, 8vw, 64px);
  font-weight: 700;
  letter-spacing: 0.08em;
  background: linear-gradient(90deg, #3AA9FF, #7FE9FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(58,169,255,0.6);
}

/* Subtítulo */
.subtitle {
  margin-top: 8px;
  font-size: 14px;
  letter-spacing: 0.25em;
  color: #cfefff;
  opacity: 0.85;
}

/* Hero */
.hero {
  margin-top: 32px;
  font-size: clamp(20px, 4vw, 28px);
  font-weight: 500;
}

/* Descrição */
.description {
  margin-top: 16px;
  font-size: 16px;
  opacity: 0.9;
}

/* CTA */
.cta {
  margin-top: 32px;
  padding: 14px 32px;
  border-radius: 8px;
  border: 1px solid #3AA9FF;
  background: rgba(20, 40, 70, 0.6);
  color: #eaf6ff;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(6px);
}

.cta:hover {
  box-shadow: 0 0 20px rgba(58,169,255,0.5);
}

/* Slot de login */
.login-slot {
  margin-top: 32px;
}
