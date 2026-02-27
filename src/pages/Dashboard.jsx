import React from "react";

export default function Dashboard({ user, perfil }) {
  const commercialState = perfil?.commercial_state;
  const isExpired = commercialState === "expired";

  const labels = {
    trial: "Acesso inicial (Trial)",
    active: "Plano ativo",
    expired: "Acesso expirado",
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Badge de estado comercial */}
      <div
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: 6,
          background: "#0f172a",
          color: "#fff",
          fontSize: 12,
          marginBottom: 20,
        }}
      >
        {labels[commercialState] ?? "Estado indefinido"}
      </div>

      <h1>Dashboard</h1>

      {/* Área de escrita */}
      <div
        style={{
          marginTop: 20,
          opacity: isExpired ? 0.5 : 1,
          pointerEvents: isExpired ? "none" : "auto",
        }}
      >
        <button style={{ padding: "10px 16px" }}>
          Inserir dados
        </button>

        {isExpired && (
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Escrita desabilitada por condição comercial.
          </div>
        )}
      </div>

      {/* Área de leitura */}
      <div style={{ marginTop: 40 }}>
        <p>Visualização de dados sempre disponível.</p>
      </div>
    </div>
  );
}
