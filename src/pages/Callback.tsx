// src/pages/Callback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code) {
      // Qui chiami il backend per scambiare code -> access token
      fetch(`/api/spotify/callback?code=${code}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Token ricevuto:", data);
          // Salvalo in localStorage o stato globale
          navigate("/dashboard"); // Vai alla pagina principale
        })
        .catch((err) => console.error(err));
    } else {
      console.error("Nessun code ricevuto da Spotify");
    }
  }, []);

  return <div>Logging in with Spotify...</div>;
};
