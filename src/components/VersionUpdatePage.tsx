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
      className="update-page-wrapper"
      style={{
        position: isPreview ? "relative" : "fixed",
        inset: isPreview ? undefined : 0,
        width: "100%",
        minHeight: isPreview ? "420px" : "100vh",
        height: isPreview ? "100%" : "100vh",
        zIndex: isPreview ? 10 : 99999,
        background: "radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isPreview ? "16px" : "20px",
        overflowY: "auto",
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
          width: "min(500px, 90vw)",
          height: "min(500px, 90vw)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(168,85,247,0.1) 50%, transparent 75%)",
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
          backgroundSize: "32px 32px",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      />

      {isPreview && onClosePreview && (
        <button
          onClick={onClosePreview}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 20,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff",
            borderRadius: 10,
            padding: "8px 16px",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          Chiudi Anteprima
        </button>
      )}

      {/* Main Responsive Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="update-card"
      >
        {/* HOURGLASS CONTAINER (Left on desktop, Top/Center on mobile) */}
        <div className="update-hourglass-wrapper">
          <div className="update-hourglass-box">
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
              <Hourglass className="update-hourglass-icon" strokeWidth={1.8} />
            </motion.div>

            {/* Glowing particle ring */}
            <motion.div
              animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: "-4px",
                borderRadius: "24px",
                border: "1px solid rgba(56, 189, 248, 0.5)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* CONTENT CONTAINER (Right on desktop, Center/Bottom on mobile) */}
        <div className="update-content-box">
          <div className="update-badge-row">
            <span className="update-status-badge">
              <Sparkles size={11} /> AGGIORNAMENTO IN CORSO
            </span>
            {APP_VERSION && (
              <span className="update-current-version">
                (attuale: {APP_VERSION})
              </span>
            )}
          </div>

          <h1 className="update-title">
            aggiornamento versione {targetVersion}
          </h1>

          <p className="update-description">
            Stiamo aggiornando il sistema per offrirti nuove funzionalità e prestazioni migliorate.
            L'applicazione tornerà disponibile a breve.
          </p>

          {/* Animated loading bar */}
          <div className="update-progress-container">
            <div className="update-progress-track">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="update-progress-bar"
              />
            </div>
            <span className="update-progress-text">
              Sincronizzazione pacchetti in corso...
            </span>
          </div>
        </div>
      </motion.div>

      {/* Admin access hint footer */}
      {!isPreview && (
        <a
          href="/admin"
          className="update-admin-link"
        >
          <Shield size={13} /> Dashboard Amministrazione
        </a>
      )}

      {/* Responsive Stylesheet */}
      <style>{`
        .update-card {
          position: relative;
          z-index: 1;
          max-width: 720px;
          width: 100%;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 24px;
          padding: 36px 40px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(56, 189, 248, 0.15);
          display: flex;
          align-items: center;
          gap: 32px;
          box-sizing: border-box;
          margin: auto;
        }

        .update-hourglass-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .update-hourglass-box {
          width: 96px;
          height: 96px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(168, 85, 247, 0.18));
          border: 1px solid rgba(56, 189, 248, 0.45);
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .update-hourglass-icon {
          width: 46px;
          height: 46px;
        }

        .update-content-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .update-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .update-status-badge {
          font-size: 10px;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.14);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(56, 189, 248, 0.35);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
        }

        .update-current-version {
          font-size: 11px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.45);
        }

        .update-title {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.25;
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-transform: lowercase;
          word-break: break-word;
        }

        .update-description {
          margin: 4px 0 0 0;
          font-size: 13.5px;
          line-height: 1.55;
          color: #94a3b8;
        }

        .update-progress-container {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .update-progress-track {
          height: 6px;
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          overflow: hidden;
          position: relative;
        }

        .update-progress-bar {
          height: 100%;
          width: 55%;
          background: linear-gradient(90deg, transparent, #38bdf8, #c084fc, transparent);
          border-radius: 99px;
        }

        .update-progress-text {
          font-size: 10px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.35);
          text-align: right;
        }

        .update-admin-link {
          margin-top: 24px;
          font-size: 11px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.3);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
          padding: 8px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .update-admin-link:hover {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.2);
        }

        /* ── MOBILE OPTIMIZATIONS (< 640px) ────────────────────────── */
        @media (max-width: 640px) {
          .update-card {
            flex-direction: column;
            text-align: center;
            padding: 28px 20px;
            gap: 20px;
            border-radius: 20px;
          }

          .update-hourglass-box {
            width: 80px;
            height: 80px;
            border-radius: 18px;
          }

          .update-hourglass-icon {
            width: 38px;
            height: 38px;
          }

          .update-content-box {
            align-items: center;
          }

          .update-badge-row {
            justify-content: center;
          }

          .update-title {
            font-size: 20px;
          }

          .update-description {
            font-size: 12.5px;
          }

          .update-progress-text {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
