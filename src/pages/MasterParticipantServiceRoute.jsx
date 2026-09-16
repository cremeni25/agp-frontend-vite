import { useSearchParams } from "react-router-dom";
import MasterParticipantService from "./MasterParticipantService";
import MasterBaselineContextual from "./MasterBaselineContextual";

export default function MasterParticipantServiceRoute() {
  const [params] = useSearchParams();
  const serviceId = params.get("servico") || "cadastro";
  const contextual = Boolean(
    params.get("instituicao") &&
    params.get("projeto") &&
    params.get("participante") &&
    serviceId !== "cadastro"
  );

  if (contextual && serviceId === "linha-base") {
    return <MasterBaselineContextual />;
  }

  return (
    <div className={contextual ? "agp-contextual-participant-service" : ""}>
      {contextual && <style>{`.agp-contextual-participant-service .dashboard-overlay.master-page > section.master-panel:first-of-type{display:none}`}</style>}
      <MasterParticipantService />
    </div>
  );
}
