// src/pages/Register.jsx
import AuthBlock from "../components/AuthBlock";
import "../styles/home.css";

export default function Register() {
  return (
    <div className="home-container">
      <div className="home-overlay">
        <div className="brand-block">
          <img
            src="/agp-logo.png"
            alt="AGP"
            className="logo-agp-img"
          />
          <div className="logo-subtitle">
            SPORTS INTELLIGENCE PLATFORM
          </div>
        </div>

        <div style={{ marginTop: "40px" }}>
          <AuthBlock initialMode="signup" />
        </div>
      </div>
    </div>
  );
}
