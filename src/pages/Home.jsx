// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Background institucional AGP */}
      <div className="home-background institutional" />

      {/* Overlay para legibilidade */}
      <div className="home-overlay" />

      {/* Conteúdo */}
      <div className="home-content">
        <h1 className="home-title">AGP</h1>

        <h2 className="home-subtitle">
          Sports Intelligence Platform
        </h2>

        <p className="home-description">
          Transformando dados em decisões esportivas
        </p>

        <button
          className="home-button"
          onClick={() => navigate("/login")}
        >
          Entrar no sistema
        </button>
      </div>
    </div>
  );
}
