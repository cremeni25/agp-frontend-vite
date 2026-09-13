import { useSearchParams } from "react-router-dom";
import MasterParticipantService from "./MasterParticipantService";

export default function MasterParticipantServiceRoute() {
  const [params] = useSearchParams();
  const contextual = Boolean(
    params.get("instituicao") &&
    params.get("projeto") &&
    params.get("participante") &&
    params.get("servico") !== "cadastro"
  );

  return (
    <div className={contextual ? "agp-contextual-participant-service" : ""}>
      {contextual && <style>{`.agp-contextual-participant-service .dashboard-overlay.master-page > .master-panel:first-of-type{display:none}`}</style>}
      <MasterParticipantService />
    </div>
  );
}
