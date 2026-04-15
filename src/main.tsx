import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Rilevamento manuale veloce dell'ambiente Alexa per disabilitare PWA
const isAlexa = window.location.search.includes("env=alexa") || 
                window.navigator.userAgent.toLowerCase().includes("alexa") ||
                window.navigator.userAgent.toLowerCase().includes("silk/");

if (isAlexa) {
  console.log("[Alexa] PWA/Service Worker disabled for performance");
  // Se c'è un service worker già registrato, proviamo a rimuoverlo
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) { registration.unregister(); }
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
