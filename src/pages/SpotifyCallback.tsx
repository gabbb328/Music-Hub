import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { handleSpotifyCallback } from "@/services/spotify-auth";

export default function SpotifyCallback() {
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const processed    = useRef(false);

  useEffect(() => {
    if (processed.current) return;

    const code  = searchParams.get("code");
    const error = searchParams.get("error");

    if (!code && !error) return;

    processed.current = true;

    const process = async () => {
      try {
        if (error) {
          console.error("Spotify auth error:", error);
          navigate("/login");
          return;
        }
        await handleSpotifyCallback(code as string);
        navigate("/");
      } catch (err) {
        console.error("Callback error:", err);
        navigate("/login");
      }
    };

    process();
  }, [navigate, searchParams]);

  // Layout completamente inline — nessuna dipendenza da CSS variables
  // così funziona sempre anche prima che ThemeProvider abbia applicato il tema
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
          style={{ width: 48, height: 48, color: "#6366f1", margin: "0 auto 16px" }}
        />
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Completing login…</p>
      </div>
    </div>
  );
}
