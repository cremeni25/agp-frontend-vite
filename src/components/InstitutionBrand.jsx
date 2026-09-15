export default function InstitutionBrand({ institution, compact = false }) {
  if (!institution) return null;

  const primary = institution.cor_primaria || "#1A2040";
  const secondary = institution.cor_secundaria || "#F36E21";
  const displayName = institution.nome_exibicao || institution.nome;

  return (
    <div
      className={`institution-brand${compact ? " compact" : ""}`}
      style={{ "--institution-primary": primary, "--institution-secondary": secondary }}
    >
      {institution.logo_url ? (
        <img className="institution-brand-logo" src={institution.logo_url} alt={`Logo ${displayName}`} />
      ) : (
        <div className="institution-brand-monogram" aria-hidden="true">{displayName?.slice(0, 2)?.toUpperCase()}</div>
      )}
      <div className="institution-brand-copy">
        <span>AGP Sports Intelligence</span>
        <strong>{displayName}</strong>
        {institution.localidade && <small>{institution.localidade}</small>}
      </div>
    </div>
  );
}
