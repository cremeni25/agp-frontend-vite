import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./styles/design-system.css";
import "./styles/approved-logo.css";
import "./styles/home.css";
import "./styles/divisao.css";
import "./styles/auth.css";
import "./styles/dashboard-atleta.css";
import "./styles/dashboard-comissao.css";
import "./styles/dashboard-clube.css";
import "./styles/dashboard-master.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
