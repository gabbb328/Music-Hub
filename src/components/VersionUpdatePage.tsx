import { motion } from "framer-motion";
import { Hourglass, Shield, Sparkles } from "lucide-react";
import { APP_VERSION } from "@/hooks/version";

interface VersionUpdatePageProps {
  targetVersion?: string;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export default function VersionUpdatePage({
  targetVersion = "v1.9.0",
  isPreview = false,
  onClosePreview,
}: VersionUpdatePageProps) {
  return (
    <div
      style={{
        position: isPreview ? "relative" : "fixed",
        inset: isPreview ? undefined : 0,
        width: "100%",
        minHeight: isPreview ? "400px" : "100vh",
        height: isPreview ? "100%" : "100vh",
        zIndex: isPreview ? 10 : 99999,
        background: "radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflow: "hidden",
        boxSizing: "border-box",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background ambient lighting effects */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      {/* Grid line background overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          opacity: 0.6,
        }}
      />

      {isPreview && onClosePreview && (
        <button
          onClick={onClosePreview}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 20,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
          }}
        >
          Chiudi Anteprima
        </button>
      )}

      {/* Main Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "780px",
          width: "100%",
          background: "rgba(15, 23, 42, 0.75)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "24px",
          padding: "36px 44px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: "36px",
        }}
      >
        {/* LEFT SIDE: Hourglass rotating 180 degrees */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.15))",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              boxShadow: "0 0 25px rgba(56, 189, 248, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Hourglass Icon with 180-degree rotation animation */}
            <motion.div
              animate={{ rotate: [0, 180, 180, 360] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.45, 0.55, 1],
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
              }}
            >
              <Hourglass size={48} strokeWidth={1.8} />
            </motion.div>

            {/* Glowing particle ring */}
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: "-4px",
                borderRadius: "28px",
                border: "1px solid rgba(56, 189, 248, 0.5)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* RIGHT SIDE: "aggiornamento versione <numero versione>" */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.12)",
                padding: "3px 10px",
                borderRadius: "20px",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Sparkles size={12} /> AGGIORNAMENTO IN CORSO
            </span>
            {APP_VERSION && (
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "rgba(255, 255, 255, 0.4)",
                }}
              >
                (attuale: {APP_VERSION})
              </span>
            )}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textTransform: "lowercase",
            }}
          >
            aggiornamento versione {targetVersion}
          </h1>

          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "#94a3b8",
            }}
          >
            Stiamo aggiornando il sistema per offrirti nuove funzionalità e prestazioni migliorate.
            L'applicazione tornerà disponibile a breve.
          </p>

          {/* Progress bar animation effect */}
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div
              style={{
                height: "6px",
                width: "100%",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "99px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  height: "100%",
                  width: "50%",
                  background: "linear-gradient(90deg, transparent, #38bdf8, #c084fc, transparent)",
                  borderRadius: "99px",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "monospace",
                color: "rgba(255,255,255,0.35)",
                textAlign: "right",
              }}
            >
              Sincronizzazione pacchetti in corso...
            </span>
          </div>
        </div>
      </motion.div>

      {/* Admin access hint footer */}
      {!isPreview && (
        <a
          href="/admin"
          style={{
            marginTop: "24px",
            fontSize: "11px",
            fontFamily: "monospace",
            color: "rgba(255, 255, 255, 0.25)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(56, 189, 248, 0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.25)")}
        >
          <Shield size={12} /> Dashboard Amministrazione
        </a>
      )}
    </div>
  );
}
