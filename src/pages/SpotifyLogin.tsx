import { motion } from "framer-motion";
import { Headphones, ExternalLink } from "lucide-react";
import { redirectToSpotifyAuth } from "@/services/spotify-auth";
import { useAlexa } from "@/hooks/useAlexa";

export default function SpotifyLogin() {
  const isAlexa = useAlexa();

  const handleLogin = () => {
    redirectToSpotifyAuth();
  };

  // ── Alexa/Echo Show: layout semplificato, zero backdrop-blur, colori hardcoded ──
  if (isAlexa) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0f1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "#111827",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "16px",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <Headphones
            style={{ width: 72, height: 72, color: "#6366f1", margin: "0 auto 16px" }}
          />

          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#f8fafc",
            }}
          >
            <span style={{ color: "#6366f1" }}>Music</span>Hub
          </h1>

          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "32px" }}>
            Your personal music experience
          </p>

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              backgroundColor: "#1DB954",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "16px",
              padding: "16px 24px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 4px 24px rgba(29,185,84,0.3)",
            }}
          >
            <ExternalLink style={{ width: 20, height: 20 }} />
            Login with Spotify
          </button>

          <p style={{ color: "#64748b", fontSize: "11px", marginTop: "16px" }}>
            By logging in, you agree to Spotify's Terms of Service
          </p>
        </div>
      </div>
    );
  }

  // ── Standard (browser normale) ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-surface border-2 border-primary/20 rounded-2xl">
          <div className="p-8 space-y-6">

            <div className="text-center space-y-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="inline-block"
              >
                <Headphones className="w-20 h-20 text-primary mx-auto" />
              </motion.div>

              <h1 className="text-4xl font-bold">
                <span className="text-primary">Music</span>
                <span className="text-foreground">Hub</span>
              </h1>
              <p className="text-muted-foreground">Your personal music experience</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleLogin}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#1DB954]/20"
              >
                <ExternalLink className="w-5 h-5" />
                Login with Spotify
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Music Hub uses Spotify to provide you with personalized music experience
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                By logging in, you agree to Spotify's Terms of Service
              </p>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
