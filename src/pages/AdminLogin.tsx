import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, Lock, User, AlertTriangle } from "lucide-react";

// ─── SHA-256 via Web Crypto API ───────────────────────────────────────────────
async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getAuthorizedPairs(): Array<{ u: string; p: string }> {
  const raw = import.meta.env.VITE_ADMIN_CREDENTIALS ?? "";
  if (!raw) return [];
  return raw.split(",").map((pair: string) => {
    const [u, p] = pair.split(":");
    return { u: u?.trim(), p: p?.trim() };
  });
}

// ─── Session helpers ──────────────────────────────────────────────────────────
const SESSION_KEY = "admin_session";
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 ore

export interface AdminSession {
  username: string;
  expiresAt: number;
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s: AdminSession = JSON.parse(raw);
    if (Date.now() > s.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function setAdminSession(username: string) {
  const session: AdminSession = {
    username,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Componente login ─────────────────────────────────────────────────────────
interface AdminLoginProps {
  onSuccess: (username: string) => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (locked || loading) return;

      setLoading(true);
      setError("");

      // Piccolo delay anti-brute-force (500ms)
      await new Promise((r) => setTimeout(r, 500));

      const [uHash, pHash] = await Promise.all([
        sha256hex(username.trim()),
        sha256hex(password),
      ]);

      const pairs = getAuthorizedPairs();
      const match = pairs.find((p) => p.u === uHash && p.p === pHash);

      if (match) {
        setAdminSession(username.trim());
        onSuccess(username.trim());
      } else {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= 5) {
          setLocked(true);
          setError("Troppi tentativi falliti. Ricarica la pagina per riprovare.");
        } else {
          setError(`Credenziali non valide. (${5 - next} tentativi rimasti)`);
        }
      }

      setLoading(false);
    },
    [username, password, attempts, locked, loading, onSuccess]
  );

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-[#0d1322]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-500/70 font-mono uppercase tracking-widest">
                  Accesso riservato
                </p>
                <h1 className="text-white font-bold text-lg leading-none">
                  Admin Panel
                </h1>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-mono uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={locked}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all disabled:opacity-40"
                  placeholder="nome utente"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-mono uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={locked}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all disabled:opacity-40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || locked || !username || !password}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Accedi
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6">
            <p className="text-center text-[10px] text-white/20 font-mono">
              Sessione valida per 4 ore · Accesso solo da URL diretto
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
