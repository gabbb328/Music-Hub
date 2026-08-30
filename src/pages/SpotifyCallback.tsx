import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { handleSpotifyCallback } from "@/services/spotify-auth";
import { gooeyToast } from "goey-toast";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (!code && !error) return;

    processed.current = true;

    const process = async () => {
      try {
        if (error) {
          console.error("Spotify auth error:", error);
          gooeyToast.error("Accesso fallito", { description: String(error) });
          navigate("/login");
          return;
        }

        // 1. Initial big connection toast with progress steps
        const toastId = gooeyToast.info("Connessione in corso", {
          description:
            "⏳ Connessione a Spotify...\n⏳ Rilevamento dispositivo...",
          duration: 10000,
        });

        await handleSpotifyCallback(code as string, state);

        // Step 1: Spotify Connection completed
        await new Promise((r) => setTimeout(r, 600));
        gooeyToast.update(toastId, {
          title: "Connessione in corso",
          description: "✓ Connesso a Spotify\n⏳ Rilevamento dispositivo...",
          type: "info",
        });

        // Step 2: Device Detection completed
        await new Promise((r) => setTimeout(r, 750));
        gooeyToast.update(toastId, {
          title: "Connessione completata",
          description: "✓ Connesso a Spotify\n✓ Dispositivo Web Player pronto",
          type: "success",
        });

        // Step 3: Morph into compact final "Accesso completato" toast
        await new Promise((r) => setTimeout(r, 650));
        gooeyToast.dismiss(toastId);
        gooeyToast.success("Accesso completato", {
          description: "Benvenuto su Music Hub!",
        });

        const returnPath = localStorage.getItem("return_path") || "/";
        localStorage.removeItem("return_path");
        navigate(returnPath);
      } catch (err) {
        console.error("Callback error:", err);
        gooeyToast.error("Errore di autenticazione", {
          description: "Impossibile accedere",
        });
        navigate("/login");
      }
    };

    process();
  }, [navigate, searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0f1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Loader2
          className="animate-spin"
          style={{
            width: 48,
            height: 48,
            color: "#6366f1",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Completing login…</p>
      </div>
    </div>
  );
}
