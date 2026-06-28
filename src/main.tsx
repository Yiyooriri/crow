import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CrowLandingV2 from "./CrowLandingV2";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CrowLandingV2 />
  </StrictMode>,
);
