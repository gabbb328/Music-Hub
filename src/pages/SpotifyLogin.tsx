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
          backgroundColor: "#080d1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            backgroundColor: "#0c1226",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <Headphones
            style={{ width: 64, height: 64, color: "#3b82f6", margin: "0 auto 16px" }}
          />

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              marginBottom: "4px",
              letterSpacing: "-0.02em"
            }}
          >
            <span style={{ color: "#3b82f6" }}>Music</span>Hub
          </h1>

          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "32px" }}>
            Your personal music experience
          </p>

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              backgroundColor: "#1DB954",
              color: "white",
              fontWeight: 700,
              fontSize: "16px",
              padding: "18px 24px",
              borderRadius: "10px",
              border: "none",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            Login with Spotify
          </button>
          
          <p style={{ color: "#475569", fontSize: "10px", marginTop: "20px" }}>
            Optimized for Alexa Echo Show
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
