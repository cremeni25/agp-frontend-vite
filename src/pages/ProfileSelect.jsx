// src/pages/ProfileSelect.jsx
export default function ProfileSelect() {
  function go(role) {
    window.location.href = `/dashboard/${role}`;
  }

  return (
    <div className="profile-box">
      <h2 className="profile-title">Selecione seu perfil</h2>

      <button onClick={() => go("athlete")} className="profile-btn">
        Atleta
      </button>

      <button onClick={() => go("coach")} className="profile-btn">
        Comissão Técnica
      </button>

      <button onClick={() => go("club")} className="profile-btn">
        Clube / Associação
      </button>

      <button onClick={() => go("master")} className="profile-btn">
        Gestão Master
      </button>
    </div>
  );
}
