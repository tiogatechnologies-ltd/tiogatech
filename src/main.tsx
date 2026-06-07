import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./lib/webVitals";
import { captureAttributionFromUrl } from "./lib/attribution";

// Capture affiliate/UTM params before React mounts so first lead carries them
captureAttributionFromUrl();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Lightweight monitoring: LCP/INP/CLS + runtime errors (fire & forget)
initWebVitals();
