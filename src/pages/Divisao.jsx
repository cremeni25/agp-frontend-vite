// src/pages/Divisao.jsx

import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import "../styles/divisao.css";

export default function Divisao() {
  const navigate = useNavigate();

  const cards = [
    { id: "atletas", label: "Atletas" },
    { id: "comissao", label: "Comissão Técnica" },
    { id: "clubes", label: "Clubes & Associações" },
    { id: "master", label: "Master" }
  ];

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

        <div className="divisao-container">
          {cards.map((card) => (
            <div
              key={card.id}
              className="divisao-card"
              onClick={() => navigate(`/login/${card.id}`)}
            >
              <h3>{card.label}</h3>
              <button>Acessar</button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
