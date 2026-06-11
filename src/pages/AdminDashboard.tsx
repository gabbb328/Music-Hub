import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LogOut,
  RefreshCw,
  Server,
  Smartphone,
  Key,
  Clock,
  AlertCircle,
  Activity,
  GitBranch,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  TerminalSquare,
  User,
  XCircle,
  WifiOff,
  Music,
  TrendingUp,
  Radio,
  List,
  Heart,
  BarChart2,
  Mail,
  Users,
  Lock,
  Unlock,
  Trash2,
  Eye,
  EyeOff,
  Keyboard,
  X,
  MessageSquare,
  Database,
} from "lucide-react";
import { getToken } from "@/services/spotify-auth";
import { usePlaybackState } from "@/hooks/useSpotify";
import { clearAdminSession, AdminSession } from "./AdminLogin";

function fmtDate(ts: number | string | undefined) {
  if (!ts) return "—";
  return new Date(Number(ts)).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "ora";
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}
async function spotifyGet(path: string) {
  const token = getToken();
  if (!token) throw new Error("no token");
  const r = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const USERS_KEY = "admin_collab_users";
import {
  CollabUser,
  getCollabUsers,
  saveCollabUsers,
  deleteCollabUser,
  AdminFeedback,
  deleteAdminFeedback,
  getAdminFeedbacks,
  saveAdminFeedbacks,
  getSupabaseTableCounts,
  getRecentNeuroStates,
  testSupabaseLatency,
  SupabaseTableCounts,
  UserNeuroState,
  getGlobalSettings,
  saveGlobalSettings,
  GlobalSettings,
} from "@/services/supabase-api";

const MSGS_KEY = "admin_messages";
interface AdminMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  read: boolean;
}
function loadMessages(): AdminMessage[] {
  try {
    return JSON.parse(localStorage.getItem(MSGS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1800);
      }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 2,
        color: ok ? "#34d399" : "rgba(255,255,255,0.25)",
        display: "flex",
        alignItems: "center",
      }}
    >
      {ok ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}
function Dot({
  active,
  color = "#34d399",
}: {
  active: boolean;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: active ? color : "rgba(255,255,255,0.15)",
        boxShadow: active ? `0 0 5px ${color}` : "none",
        flexShrink: 0,
      }}
    />
  );
}
function PLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 9,
        fontFamily: "monospace",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.22)",
        marginBottom: 5,
        marginTop: 0,
      }}
    >
      {children}
    </p>
  );
}
function KV({ k, v }: { k: string; v: any }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 6,
        background: "rgba(0,0,0,0.22)",
        borderRadius: 7,
        padding: "4px 8px",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: "rgba(255,255,255,0.22)",
        }}
      >
        {k}
      </span>
      <span
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: "rgba(255,255,255,0.55)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 120,
        }}
      >
        {v}
      </span>
    </div>
  );
}
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        height: 3,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 99,
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{ height: "100%", background: color, borderRadius: 99 }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}
function Spinner() {
  return (
    <RefreshCw
      size={12}
      style={{
        animation: "spin 1s linear infinite",
        color: "rgba(255,255,255,0.3)",
      }}
    />
  );
}
function Empty({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: "rgba(255,255,255,0.2)",
        fontSize: 11,
        paddingTop: 4,
      }}
    >
      <Icon size={13} /> {text}
    </div>
  );
}
function Panel({
  children,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(10,18,40,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(56,189,248,0.15)",
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
function PHead({
  icon: Icon,
  label,
  color,
  right,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Icon size={13} color={color} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.58)",
            letterSpacing: "0.13em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}
function RefreshBtn({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "rgba(255,255,255,0.25)",
        display: "flex",
      }}
    >
      <RefreshCw
        size={12}
        style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
      />
    </button>
  );
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ["R", "Refresh tutti i pannelli"],
    ["1", "Scroll → Sezione token/riproduzione"],
    ["2", "Scroll → Sezione statistiche"],
    ["3", "Scroll → Sezione utenti/messaggi"],
    ["4", "Scroll → Sezione Vercel"],
    ["Esc", "Chiudi questo pannello"],
    ["?", "Mostra shortcuts"],
    ["Ctrl+L", "Logout"],
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(13,19,34,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: 24,
          minWidth: 340,
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Keyboard size={14} color="#34d399" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shortcuts.map(([key, desc]) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <kbd
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.7)",
                  minWidth: 60,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {key}
              </kbd>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                {desc}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TokenPanel() {
  const token = getToken();
  const expiresAt = localStorage.getItem("spotify_token_expires_at");
  const expiresInSec = expiresAt
    ? Math.max(0, Math.floor((Number(expiresAt) - Date.now()) / 1000))
    : 0;
  const pct = Math.min(100, (expiresInSec / 3600) * 100);
  const [expanded, setExpanded] = useState(false);
  let decoded: Record<string, any> | null = null;
  if (token) {
    try {
      const p = token.split(".");
      if (p.length === 3)
        decoded = JSON.parse(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")));
    } catch {}
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={Key}
        label="Access Token"
        color="#34d399"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Dot active={!!token} />
            <span
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                color: token ? "#34d399" : "#f87171",
              }}
            >
              {token ? "ACTIVE" : "NULL"}
            </span>
          </div>
        }
      />
      {token ? (
        <>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <PLabel>scadenza</PLabel>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                {Math.floor(expiresInSec / 60)}m · {fmtDate(Number(expiresAt))}
              </span>
            </div>
            <MiniBar pct={pct} color="linear-gradient(90deg,#10b981,#34d399)" />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <PLabel>raw token</PLabel>
              <CopyBtn text={token} />
            </div>
            <div
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "rgba(0,0,0,0.38)",
                borderRadius: 11,
                padding: "9px 11px",
                cursor: "pointer",
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  color: "rgba(255,255,255,0.3)",
                  wordBreak: "break-all",
                  lineHeight: 1.6,
                  margin: 0,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: expanded ? 999 : 2,
                  overflow: "hidden",
                }}
              >
                {token}
              </p>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  marginTop: 5,
                  fontSize: 9,
                  color: "rgba(255,255,255,0.16)",
                }}
              >
                {expanded ? (
                  <>
                    <ChevronUp size={9} /> riduci
                  </>
                ) : (
                  <>
                    <ChevronDown size={9} /> espandi
                  </>
                )}
              </span>
            </div>
          </div>
          {decoded && (
            <div>
              <PLabel>jwt payload</PLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Object.entries(decoded)
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        gap: 8,
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 6,
                        padding: "3px 8px",
                        fontFamily: "monospace",
                        fontSize: 9,
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(52,211,153,0.5)",
                          minWidth: 65,
                          flexShrink: 0,
                        }}
                      >
                        {k}
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.36)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <Empty icon={XCircle} text="Nessun token — utente non loggato" />
      )}
    </div>
  );
}

function NowPlayingPanel() {
  const { data: pb } = usePlaybackState();
  const track = pb?.item;
  const pct = track && pb ? (pb.progress_ms / track.duration_ms) * 100 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={Activity}
        label="Riproduzione"
        color="#a78bfa"
        right={
          pb?.is_playing ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 9,
                fontFamily: "monospace",
                color: "#34d399",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#34d399",
                  animation: "pulse 1.5s infinite",
                }}
              />{" "}
              PLAYING
            </span>
          ) : undefined
        }
      />
      {track ? (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <img
              src={track.album.images[0]?.url}
              alt=""
              style={{
                width: 46,
                height: 46,
                borderRadius: 9,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.88)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.name}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.artists.map((a: any) => a.name).join(", ")}
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.2)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.album.name}
              </p>
            </div>
          </div>
          <div>
            <MiniBar pct={pct} color="linear-gradient(90deg,#7c3aed,#a78bfa)" />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 9,
                fontFamily: "monospace",
                color: "rgba(255,255,255,0.2)",
                marginTop: 3,
              }}
            >
              <span>{fmtMs(pb?.progress_ms ?? 0)}</span>
              <span>{fmtMs(track.duration_ms)}</span>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}
          >
            {[
              ["repeat", pb?.repeat_state],
              ["shuffle", pb?.shuffle_state ? "on" : "off"],
              ["device", pb?.device?.name ?? "—"],
              ["volume", `${pb?.device?.volume_percent ?? 0}%`],
              ["pop.", track.popularity],
              ["explicit", track.explicit ? "yes" : "no"],
            ].map(([k, v]) => (
              <KV key={k} k={k} v={v} />
            ))}
          </div>
        </>
      ) : (
        <Empty icon={Zap} text="Nessuna traccia in riproduzione" />
      )}
    </div>
  );
}

function ConnectedUsersPanel() {
  const [devices, setDevices] = useState<any[]>([]);
  const [playbacks, setPlaybacks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const d = await spotifyGet("/me/player/devices");
      const devs = d.devices ?? [];
      setDevices(devs);
      const pb = await spotifyGet("/me/player").catch(() => null);
      if (pb) {
        const map: Record<string, any> = {};
        devs.forEach((dev: any) => {
          if (dev.is_active) map[dev.id] = pb;
        });
        setPlaybacks(map);
      }
    } catch {
      setDevices([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const typeEmoji: Record<string, string> = {
    Smartphone: "📱",
    Computer: "💻",
    Speaker: "🔊",
    TV: "📺",
    CastAudio: "🔊",
    CastVideo: "📺",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={Users}
        label="Dispositivi connessi"
        color="#60a5fa"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              auto 15s
            </span>
            <RefreshBtn onClick={fetchAll} loading={loading} />
          </div>
        }
      />

      {loading && devices.length === 0 ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : devices.length === 0 ? (
        <Empty icon={WifiOff} text="nessun dispositivo rilevato" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {devices.map((d) => {
            const pb = playbacks[d.id];
            const track = pb?.item;
            return (
              <div
                key={d.id}
                style={{
                  borderRadius: 13,
                  padding: "11px 13px",
                  border: d.is_active
                    ? "1px solid rgba(96,165,250,0.25)"
                    : "1px solid rgba(255,255,255,0.05)",
                  background: d.is_active
                    ? "rgba(96,165,250,0.06)"
                    : "rgba(255,255,255,0.015)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>
                    {typeEmoji[d.type] ?? "🎵"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.82)",
                          margin: 0,
                        }}
                      >
                        {d.name}
                      </p>
                      {d.is_active && (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            background: "rgba(96,165,250,0.18)",
                            color: "#93c5fd",
                            padding: "2px 7px",
                            borderRadius: 99,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <span
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              background: "#60a5fa",
                              animation: "pulse 2s infinite",
                            }}
                          />{" "}
                          ATTIVO
                        </span>
                      )}
                      {d.is_private_session && (
                        <span
                          style={{
                            fontSize: 8,
                            color: "rgba(251,191,36,0.7)",
                            background: "rgba(251,191,36,0.1)",
                            padding: "2px 6px",
                            borderRadius: 99,
                          }}
                        >
                          🔒 privata
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "monospace",
                          color: "rgba(255,255,255,0.22)",
                        }}
                      >
                        {d.type}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "monospace",
                          color: "rgba(255,255,255,0.22)",
                        }}
                      >
                        vol {d.volume_percent}%
                      </span>
                      {d.is_restricted && (
                        <span
                          style={{
                            fontSize: 9,
                            color: "rgba(248,113,113,0.6)",
                          }}
                        >
                          restricted
                        </span>
                      )}
                    </div>

                    {d.is_active && track && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 8,
                          background: "rgba(0,0,0,0.25)",
                          borderRadius: 9,
                          padding: "7px 10px",
                        }}
                      >
                        <img
                          src={track.album.images[0]?.url}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "rgba(255,255,255,0.75)",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {track.name}
                          </p>
                          <p
                            style={{
                              fontSize: 9,
                              color: "rgba(255,255,255,0.35)",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {track.artists.map((a: any) => a.name).join(", ")}
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: "monospace",
                            color: pb.is_playing
                              ? "#34d399"
                              : "rgba(255,255,255,0.3)",
                            flexShrink: 0,
                          }}
                        >
                          {pb.is_playing ? "▶" : "⏸"}{" "}
                          {fmtMs(pb.progress_ms ?? 0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <CopyBtn text={d.id} />
                </div>
                <p
                  style={{
                    fontSize: 8,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.1)",
                    marginTop: 7,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.id}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EnvString({ u, p }: { u?: string; p?: string }) {
  const [str, setStr] = useState("");
  useEffect(() => {
    if (!u || !p) {
      setStr("");
      return;
    }
    Promise.all([sha256hex(u), sha256hex(p)]).then(([uh, ph]) =>
      setStr(`${uh}:${ph}`),
    );
  }, [u, p]);
  if (!str) return null;
  return (
    <div
      style={{
        marginTop: 8,
        background: "rgba(0,0,0,0.3)",
        borderRadius: 6,
        padding: "8px",
      }}
    >
      <p
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.5)",
          margin: "0 0 4px",
        }}
      >
        Stringa hash per file .env (VITE_ADMIN_CREDENTIALS):
      </p>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <code
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            color: "#6ee7b7",
            wordBreak: "break-all",
            flex: 1,
          }}
        >
          {str}
        </code>
        <CopyBtn text={str} />
      </div>
    </div>
  );
}

interface UsersPermissionsPanelProps {
  session: AdminSession;
  isSuper: boolean;
  currentUser: CollabUser | null;
  hasModifySettings: boolean;
  hasModifyGlobal: boolean;
}

function UsersPermissionsPanel({
  session,
  isSuper,
  currentUser,
  hasModifySettings,
  hasModifyGlobal
}: UsersPermissionsPanelProps) {
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);

  useEffect(() => {
    getCollabUsers().then((all) => setUsers(all.filter((u) => u.id !== "system_settings")));
    getGlobalSettings().then(setGlobalSettings);
  }, []);

  const update = async (id: string, patch: Partial<CollabUser>) => {
    if (!hasModifySettings) {
      alert("Non hai i permessi per modificare le impostazioni dei collaboratori.");
      return;
    }
    const all = await getCollabUsers();
    const next = all.map((u) => (u.id === id ? { ...u, ...patch } : u));
    setUsers(next.filter((u) => u.id !== "system_settings"));
    await saveCollabUsers(next);
  };

  const remove = async (id: string) => {
    if (!hasModifySettings) {
      alert("Non hai i permessi per modificare le impostazioni dei collaboratori.");
      return;
    }
    const all = await getCollabUsers();
    const next = all.filter((u) => u.id !== id);
    setUsers(next.filter((u) => u.id !== "system_settings"));
    await deleteCollabUser(id);
  };

  const togglePerm = async (id: string, perm: keyof CollabUser["permissions"]) => {
    if (!hasModifySettings) {
      alert("Non hai i permessi per modificare le impostazioni dei collaboratori.");
      return;
    }
    const all = await getCollabUsers();
    const u = all.find((u) => u.id === id);
    if (!u) return;
    
    const nextPerms = { ...u.permissions, [perm]: !u.permissions[perm] };
    if (perm === "canAccessAdmin" && !nextPerms.canAccessAdmin) {
      nextPerms.canAccessInfrastructure = false;
    }

    const next = all.map((usr) => (usr.id === id ? { ...usr, permissions: nextPerms } : usr));
    setUsers(next.filter((usr) => usr.id !== "system_settings"));
    await saveCollabUsers(next);
  };

  const statusColors: Record<string, { c: string; bg: string }> = {
    pending: { c: "#fcd34d", bg: "rgba(245,158,11,0.12)" },
    accepted: { c: "#6ee7b7", bg: "rgba(16,185,129,0.1)" },
    rejected: { c: "#fca5a5", bg: "rgba(239,68,68,0.1)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={Users}
        label="Collaboratori & Permessi"
        color="#c084fc"
        right={
          <span
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            {users.length} utenti
          </span>
        }
      />

      {users.length === 0 ? (
        <Empty
          icon={Users}
          text="Nessun utente — le richieste appariranno qui"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {users.map((u) => {
            const sc = statusColors[u.status] ?? statusColors.pending;
            const isOpen = expanded === u.id;
            return (
              <div
                key={u.id}
                style={{
                  borderRadius: 13,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)",
                  overflow: "hidden",
                }}
              >
                {/* Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpanded(isOpen ? null : u.id)}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "rgba(192,132,252,0.15)",
                      border: "1px solid rgba(192,132,252,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#c084fc",
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.78)",
                        margin: 0,
                      }}
                    >
                      {u.name}
                    </p>
                    <p
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.3)",
                        margin: 0,
                        fontFamily: "monospace",
                      }}
                    >
                      {ago(u.requestedAt)}
                    </p>
                  </div>
                  {/* Badge Telegram inline sulla riga */}
                  {u.telegramChatId && (
                    <span
                      style={{
                        fontSize: 8,
                        padding: "2px 6px",
                        borderRadius: 99,
                        background: u.telegramEnabled ? "rgba(44,165,224,0.15)" : "rgba(255,255,255,0.05)",
                        color: u.telegramEnabled ? "#2CA5E0" : "rgba(255,255,255,0.2)",
                        flexShrink: 0,
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      ✈️ TG
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      fontFamily: "monospace",
                      background: sc.bg,
                      color: sc.c,
                      padding: "2px 8px",
                      borderRadius: 99,
                    }}
                  >
                    {u.status.toUpperCase()}
                  </span>
                  <ChevronDown
                    size={12}
                    color="rgba(255,255,255,0.25)"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{
                        overflow: "hidden",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        style={{
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {/* Status actions */}
                        <div>
                          <PLabel>stato</PLabel>
                          <div style={{ display: "flex", gap: 6 }}>
                            {(["pending", "accepted", "rejected"] as const).map(
                              (s) => (
                                <button
                                  key={s}
                                  onClick={() => update(u.id, { status: s })}
                                  style={{
                                    flex: 1,
                                    padding: "5px 0",
                                    borderRadius: 8,
                                    border:
                                      u.status === s
                                        ? `1px solid ${statusColors[s].c}`
                                        : "1px solid rgba(255,255,255,0.07)",
                                    background:
                                      u.status === s
                                        ? statusColors[s].bg
                                        : "transparent",
                                    color:
                                      u.status === s
                                        ? statusColors[s].c
                                        : "rgba(255,255,255,0.35)",
                                    fontSize: 9,
                                    fontFamily: "monospace",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {s}
                                </button>
                              ),
                            )}
                          </div>
                        </div>

                        {u.status === "accepted" && (
                          <>
                            {/* Permissions */}
                            <div>
                              <PLabel>permessi</PLabel>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 5,
                                }}
                              >
                                {(() => {
                                  const list: [keyof CollabUser["permissions"], string][] = [
                                    ["canViewStats", "Può vedere statistiche Spotify"],
                                    ["canViewToken", "Può vedere il token OAuth"],
                                    ["canAccessGithub", "Accesso al progetto su GitHub"],
                                    ["canAccessAdmin", "Accesso alla dashboard admin"],
                                  ];
                                  if (u.permissions.canAccessAdmin) {
                                    list.push(["canAccessInfrastructure", "Accesso all'infrastruttura"]);
                                  }
                                  list.push(["canModifySettings", "Modifica permessi/integrazioni"]);
                                  list.push(["canModifyGlobalSettings", "Modifica impostazioni globali"]);
                                  return list;
                                })().map(([perm, label]) => {
                                  const isVal = !!u.permissions[perm];
                                  return (
                                    <div
                                      key={perm}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        background: "rgba(0,0,0,0.2)",
                                        borderRadius: 8,
                                        padding: "6px 10px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                        }}
                                      >
                                        {isVal ? (
                                          <Unlock size={10} color="#34d399" />
                                        ) : (
                                          <Lock
                                            size={10}
                                            color="rgba(255,255,255,0.25)"
                                          />
                                        )}
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "rgba(255,255,255,0.55)",
                                          }}
                                        >
                                          {label}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => togglePerm(u.id, perm)}
                                        style={{
                                          width: 32,
                                          height: 16,
                                          borderRadius: 99,
                                          border: "none",
                                          cursor: "pointer",
                                          background: isVal
                                            ? "#10b981"
                                            : "rgba(255,255,255,0.1)",
                                          position: "relative",
                                          flexShrink: 0,
                                          transition: "background 0.2s",
                                        }}
                                      >
                                        <div
                                          style={{
                                            position: "absolute",
                                            top: 2,
                                            left: isVal ? 18 : 2,
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            background: "white",
                                            transition: "left 0.2s",
                                          }}
                                        />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* ── Telegram Integration — admin view only ── */}
                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {/* Header con label + toggle admin */}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <PLabel>integrazione telegram</PLabel>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 9, fontFamily: "monospace", color: u.telegramEnabled ? "#2CA5E0" : "rgba(255,255,255,0.2)" }}>
                                    {u.telegramEnabled ? "ON" : "OFF"}
                                  </span>
                                  <button
                                    onClick={() => update(u.id, { telegramEnabled: !u.telegramEnabled })}
                                    title={u.telegramEnabled ? "Sospendi notifiche Telegram" : "Abilita notifiche Telegram"}
                                    style={{
                                      width: 32,
                                      height: 16,
                                      borderRadius: 99,
                                      border: "none",
                                      cursor: "pointer",
                                      background: u.telegramEnabled ? "#2CA5E0" : "rgba(255,255,255,0.1)",
                                      position: "relative",
                                      flexShrink: 0,
                                      transition: "background 0.2s",
                                    }}
                                  >
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 2,
                                        left: u.telegramEnabled ? 18 : 2,
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        background: "white",
                                        transition: "left 0.2s",
                                      }}
                                    />
                                  </button>
                                </div>
                              </div>

                              {/* Chat ID ricevuto dall'utente (read-only) o in attesa */}
                              {u.telegramChatId ? (
                                <div
                                  style={{
                                    background: u.telegramEnabled ? "rgba(44,165,224,0.08)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${u.telegramEnabled ? "rgba(44,165,224,0.25)" : "rgba(255,255,255,0.07)"}`,
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span style={{ fontSize: 16, flexShrink: 0 }}>✈️</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                      Chat ID (inserito dall'utente)
                                    </p>
                                    <code style={{ fontSize: 11, color: u.telegramEnabled ? "#2CA5E0" : "rgba(255,255,255,0.45)", fontFamily: "monospace", fontWeight: 700 }}>
                                      {u.telegramChatId}
                                    </code>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                                    <CopyBtn text={u.telegramChatId} />
                                    <span
                                      style={{
                                        fontSize: 7,
                                        fontWeight: 700,
                                        padding: "2px 6px",
                                        borderRadius: 99,
                                        background: u.telegramEnabled ? "rgba(44,165,224,0.15)" : "rgba(255,255,255,0.05)",
                                        color: u.telegramEnabled ? "#2CA5E0" : "rgba(255,255,255,0.25)",
                                        letterSpacing: "0.08em",
                                      }}
                                    >
                                      {u.telegramEnabled ? "NOTIFICHE ATTIVE" : "NOTIFICHE SOSPESE"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px dashed rgba(255,255,255,0.08)",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span style={{ fontSize: 14, opacity: 0.5 }}>⏳</span>
                                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                                    In attesa che l'utente colleghi il proprio account Telegram
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Se accesso admin è attivo, mostra link e campi credenziali */}
                            {u.permissions.canAccessAdmin && (
                              <div
                                style={{
                                  background: "rgba(52,211,153,0.07)",
                                  border: "1px solid rgba(52,211,153,0.15)",
                                  borderRadius: 10,
                                  padding: "8px 10px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                <div>
                                  <p
                                    style={{
                                      fontSize: 9,
                                      color: "rgba(52,211,153,0.7)",
                                      margin: "0 0 4px",
                                    }}
                                  >
                                    Link dashboard per questo utente:
                                  </p>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <code
                                      style={{
                                        fontSize: 9,
                                        fontFamily: "monospace",
                                        color: "rgba(255,255,255,0.5)",
                                        flex: 1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {window.location.origin}/admin
                                    </code>
                                    <CopyBtn
                                      text={`${window.location.origin}/admin`}
                                    />
                                  </div>
                                </div>
                                <div
                                  style={{
                                    borderTop:
                                      "1px solid rgba(52,211,153,0.15)",
                                    paddingTop: 8,
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: 9,
                                      color: "rgba(52,211,153,0.7)",
                                      margin: "0 0 4px",
                                    }}
                                  >
                                    Credenziali generate per l'utente:
                                  </p>
                                  <div className="admin-credentials-row">
                                    <input
                                      type="text"
                                      placeholder="Username"
                                      value={u.credentials?.username || ""}
                                      onChange={(e) =>
                                        update(u.id, {
                                          credentials: {
                                            ...u.credentials,
                                            username: e.target.value,
                                          },
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        background: "rgba(0,0,0,0.2)",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: 6,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        color: "white",
                                        outline: "none",
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Password"
                                      value={u.credentials?.password || ""}
                                      onChange={(e) =>
                                        update(u.id, {
                                          credentials: {
                                            ...u.credentials,
                                            password: e.target.value,
                                          },
                                        })
                                      }
                                      style={{
                                        flex: 1,
                                        background: "rgba(0,0,0,0.2)",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: 6,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        color: "white",
                                        outline: "none",
                                      }}
                                    />
                                  </div>
                                  <EnvString
                                    u={u.credentials?.username}
                                    p={u.credentials?.password}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Message */}
                            {u.message && (
                              <div>
                                <PLabel>messaggio</PLabel>
                                <p
                                  style={{
                                    fontSize: 10,
                                    color: "rgba(255,255,255,0.4)",
                                    background: "rgba(0,0,0,0.2)",
                                    borderRadius: 8,
                                    padding: "7px 10px",
                                    margin: 0,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {u.message}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => remove(u.id)}
                          style={{
                            alignSelf: "flex-end",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 8,
                            padding: "5px 10px",
                            color: "#f87171",
                            fontSize: 10,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <Trash2 size={11} /> Rimuovi
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Sezione Impostazioni Globali */}
      <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
        <p style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          ⚙️ Impostazioni Generali
        </p>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
              Massimo richieste di collaborazione per sessione:
            </span>
            <input
              type="number"
              min="1"
              max="10"
              disabled={!hasModifyGlobal}
              value={globalSettings?.maxRequestsPerSession ?? 2}
              onChange={async (e) => {
                const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 2));
                const next = { maxRequestsPerSession: val };
                setGlobalSettings(next);
                await saveGlobalSettings(next);
              }}
              style={{
                width: 50,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                padding: "3px 6px",
                color: "white",
                fontSize: 10,
                textAlign: "center",
                outline: "none"
              }}
            />
          </div>
          {!hasModifyGlobal && (
            <p style={{ fontSize: 8, color: "rgba(248,113,113,0.6)", margin: 0 }}>
              * Non hai i permessi per modificare le impostazioni globali.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesPanel() {
  const [messages, setMessages] = useState<AdminMessage[]>(loadMessages);
  const [selected, setSelected] = useState<AdminMessage | null>(null);

  const markRead = (id: string) => {
    const next = messages.map((m) => (m.id === id ? { ...m, read: true } : m));
    setMessages(next);
    localStorage.setItem(MSGS_KEY, JSON.stringify(next));
  };
  const deleteMsg = (id: string) => {
    const next = messages.filter((m) => m.id !== id);
    setMessages(next);
    localStorage.setItem(MSGS_KEY, JSON.stringify(next));
    if (selected?.id === id) setSelected(null);
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={Mail}
        label="Messaggi ricevuti"
        color="#fb923c"
        right={
          unread > 0 ? (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                background: "rgba(251,146,60,0.2)",
                color: "#fb923c",
                padding: "2px 7px",
                borderRadius: 99,
              }}
            >
              {unread} nuovi
            </span>
          ) : undefined
        }
      />

      {messages.length === 0 ? (
        <Empty icon={Mail} text="Nessun messaggio" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                borderRadius: 11,
                padding: "9px 12px",
                border: m.read
                  ? "1px solid rgba(255,255,255,0.05)"
                  : "1px solid rgba(251,146,60,0.2)",
                background: m.read
                  ? "rgba(255,255,255,0.015)"
                  : "rgba(251,146,60,0.04)",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelected(m);
                markRead(m.id);
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!m.read && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#fb923c",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: m.read ? 500 : 700,
                      color: "rgba(255,255,255,0.75)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.subject}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.3)",
                      margin: 0,
                    }}
                  >
                    {m.from} · {ago(m.receivedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMsg(m.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.2)",
                    padding: 3,
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
              {selected?.id === m.id && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 0",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.45)",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {m.body}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          background: "rgba(251,146,60,0.06)",
          border: "1px solid rgba(251,146,60,0.12)",
          borderRadius: 10,
          padding: "8px 10px",
        }}
      >
        <p
          style={{
            fontSize: 9,
            color: "rgba(251,146,60,0.6)",
            margin: 0,
            fontFamily: "monospace",
          }}
        >
          Le email arrivano via EmailJS. I messaggi salvati qui provengono dalle
          richieste di collaborazione degli utenti.
        </p>
      </div>
    </div>
  );
}

function FeedbackPanel() {
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [selected, setSelected] = useState<AdminFeedback | null>(null);

  useEffect(() => {
    getAdminFeedbacks().then(setFeedbacks);
  }, []);

  const markRead = async (id: string) => {
    const next = feedbacks.map((f) => (f.id === id ? { ...f, read: true } : f));
    setFeedbacks(next);
    await saveAdminFeedbacks(next);
  };

  const deleteFb = async (id: string) => {
    const next = feedbacks.filter((f) => f.id !== id);
    setFeedbacks(next);
    await deleteAdminFeedback(id);
    if (selected?.id === id) setSelected(null);
  };

  const unread = feedbacks.filter((f) => !f.read).length;

  const typeColors: Record<string, { bg: string; c: string }> = {
    Migliorie: { bg: "rgba(52,211,153,0.1)", c: "#34d399" },
    "Fix bug": { bg: "rgba(239,68,68,0.1)", c: "#ef4444" },
    Aggiunte: { bg: "rgba(96,165,250,0.1)", c: "#60a5fa" },
    Varie: { bg: "rgba(167,139,250,0.1)", c: "#a78bfa" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={MessageSquare}
        label="Feedback Utenti"
        color="#a78bfa"
        right={
          unread > 0 ? (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                background: "rgba(167,139,250,0.2)",
                color: "#a78bfa",
                padding: "2px 7px",
                borderRadius: 99,
              }}
            >
              {unread} nuovi
            </span>
          ) : undefined
        }
      />

      {feedbacks.length === 0 ? (
        <Empty icon={MessageSquare} text="Nessun feedback" />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            maxHeight: 300,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {feedbacks.map((f) => {
            const colors = typeColors[f.type] || typeColors["Varie"];
            return (
              <div
                key={f.id}
                style={{
                  borderRadius: 11,
                  padding: "9px 12px",
                  border: f.read
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "1px solid rgba(167,139,250,0.2)",
                  background: f.read
                    ? "rgba(255,255,255,0.015)"
                    : "rgba(167,139,250,0.04)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelected(f);
                  markRead(f.id);
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!f.read && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#a78bfa",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        background: colors.bg,
                        color: colors.c,
                        padding: "2px 6px",
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      {f.type}
                    </span>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: f.read ? 500 : 700,
                        color: "rgba(255,255,255,0.75)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.userName}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFb(f.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.2)",
                      padding: 3,
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {selected?.id === f.id && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 0",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.6)",
                        margin: 0,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {f.message}
                    </p>
                    <p
                      style={{
                        fontSize: 8,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 6,
                      }}
                    >
                      {ago(f.submittedAt)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopTracksPanel() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    spotifyGet("/me/top/tracks?limit=6&time_range=short_term")
      .then((d) => setTracks(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead icon={TrendingUp} label="Top Tracks 4 sett." color="#f472b6" />
      {loading ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : tracks.length === 0 ? (
        <Empty icon={Music} text="nessun dato" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {tracks.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 7px",
                borderRadius: 9,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.2)",
                  width: 14,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                #{i + 1}
              </span>
              <img
                src={t.album.images[0]?.url}
                alt=""
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.78)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.name}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.35)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.artists[0]?.name}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 3,
                    background: "rgba(255,255,255,0.07)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${t.popularity}%`,
                      background: "#f472b6",
                      borderRadius: 99,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 8,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.22)",
                  }}
                >
                  {t.popularity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopArtistsPanel() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    spotifyGet("/me/top/artists?limit=5&time_range=short_term")
      .then((d) => setArtists(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead icon={BarChart2} label="Top Artisti 4 sett." color="#fb923c" />
      {loading ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : artists.length === 0 ? (
        <Empty icon={Music} text="nessun dato" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {artists.map((a, i) => (
            <div
              key={a.id}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.2)",
                  width: 14,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                #{i + 1}
              </span>
              <img
                src={a.images[0]?.url}
                alt=""
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.78)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.name}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.28)",
                    margin: 0,
                  }}
                >
                  {a.genres.slice(0, 2).join(", ") || "—"}
                </p>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.35)",
                  flexShrink: 0,
                }}
              >
                {(a.followers.total / 1000).toFixed(0)}k
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QueuePanel() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const d = await spotifyGet("/me/player/queue");
      setQueue(d.queue ?? []);
    } catch {
      setQueue([]);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    fetch_();
  }, [fetch_]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={List}
        label="Coda"
        color="#facc15"
        right={<RefreshBtn onClick={fetch_} loading={loading} />}
      />
      {loading ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : queue.length === 0 ? (
        <Empty icon={List} text="coda vuota" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {queue.slice(0, 7).map((t: any, i: number) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "3px 6px",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.18)",
                  width: 12,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <img
                src={t.album?.images[0]?.url}
                alt=""
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.68)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.name}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    margin: 0,
                  }}
                >
                  {t.artists?.[0]?.name}
                </p>
              </div>
              <span
                style={{
                  fontSize: 8,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              >
                {fmtMs(t.duration_ms)}
              </span>
            </div>
          ))}
          {queue.length > 7 && (
            <p
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.18)",
                textAlign: "center",
                margin: 0,
              }}
            >
              +{queue.length - 7} altri
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LibraryPanel() {
  const [liked, setLiked] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      spotifyGet("/me/tracks?limit=1").then((d) => setLiked(d.total)),
      spotifyGet("/me/playlists?limit=5").then((d) =>
        setPlaylists(d.items ?? []),
      ),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead icon={Heart} label="Libreria" color="#f87171" />
      {loading ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : (
        <>
          <div style={{ display: "flex", gap: 6 }}>
            <div
              style={{
                flex: 1,
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.14)",
                borderRadius: 11,
                padding: "10px 12px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fca5a5",
                  margin: 0,
                }}
              >
                {liked ?? "—"}
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.3)",
                  margin: 0,
                }}
              >
                brani salvati
              </p>
            </div>
            <div
              style={{
                flex: 1,
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.14)",
                borderRadius: 11,
                padding: "10px 12px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#c4b5fd",
                  margin: 0,
                }}
              >
                {playlists.length}
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.3)",
                  margin: 0,
                }}
              >
                playlist
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {playlists.map((p: any) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "3px 6px",
                }}
              >
                {p.images?.[0]?.url ? (
                  <img
                    src={p.images[0].url}
                    alt=""
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.05)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <p
                  style={{
                    flex: 1,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.65)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </p>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.22)",
                  }}
                >
                  {p.tracks.total}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecentPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const d = await spotifyGet("/me/player/recently-played?limit=8");
      setItems(d.items ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    fetch_();
  }, [fetch_]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={Radio}
        label="Ascoltati di recente"
        color="#2dd4bf"
        right={<RefreshBtn onClick={fetch_} loading={loading} />}
      />
      {loading ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : items.length === 0 ? (
        <Empty icon={Music} text="nessun dato" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((item: any, i: number) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 6px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.018)",
              }}
            >
              <img
                src={item.track.album.images[0]?.url}
                alt=""
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.72)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.track.name}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    margin: 0,
                  }}
                >
                  {item.track.artists[0]?.name}
                </p>
              </div>
              <span
                style={{
                  fontSize: 8,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.18)",
                  flexShrink: 0,
                }}
              >
                {ago(item.played_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemPanel() {
  const lsKeys = Object.keys(localStorage).filter((k) =>
    k.startsWith("spotify_"),
  );
  const lsSize = lsKeys.reduce(
    (acc, k) => acc + (localStorage.getItem(k)?.length ?? 0),
    0,
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead icon={TerminalSquare} label="Sistema" color="#2dd4bf" />
      <div>
        <PLabel>localStorage spotify</PLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {lsKeys.map((k) => {
            const v = localStorage.getItem(k) ?? "";
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(0,0,0,0.22)",
                  borderRadius: 7,
                  padding: "4px 8px",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.26)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {k.replace("spotify_", "")}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.48)",
                    flexShrink: 0,
                  }}
                >
                  {v.length > 18 ? v.slice(0, 8) + "…" : v}
                </span>
                <CopyBtn text={v} />
              </div>
            );
          })}
          <p
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.15)",
              margin: "2px 0 0",
            }}
          >
            {lsKeys.length} chiavi · ~{(lsSize / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
      <div>
        <PLabel>client</PLabel>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}
        >
          {[
            [
              "platform",
              /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
            ],
            ["lingua", navigator.language],
            ["viewport", `${window.innerWidth}×${window.innerHeight}`],
            ["online", navigator.onLine ? "yes" : "no"],
            ["timezone", Intl.DateTimeFormat().resolvedOptions().timeZone],
            ["cores", String(navigator.hardwareConcurrency ?? "—")],
          ].map(([k, v]) => (
            <KV key={k} k={k} v={v} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SupabasePanel() {
  const [counts, setCounts] = useState<SupabaseTableCounts | null>(null);
  const [recentStates, setRecentStates] = useState<UserNeuroState[]>([]);
  const [latency, setLatency] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState<"status" | "data" | "schema">(
    "status",
  );

  const url = import.meta.env.VITE_SUPABASE_URL ?? "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

  const projectId = url
    ? url.replace("https://", "").split(".")[0]
    : "Sconosciuto";

  const fetchSupabase = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [cData, sData, lData] = await Promise.all([
        getSupabaseTableCounts(),
        getRecentNeuroStates(5),
        testSupabaseLatency(),
      ]);
      setCounts(cData);
      setRecentStates(sData);
      setLatency(lData);
    } catch (e: any) {
      setErr(e.message || "Errore nel caricamento dei dati Supabase");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSupabase();
  }, [fetchSupabase]);

  const latencyColor = (l: number) => {
    if (l < 0) return "#f87171";
    if (l < 100) return "#34d399";
    if (l < 250) return "#fbbf24";
    return "#f87171";
  };

  const dbSchema = [
    {
      name: "neuro_states",
      desc: "Registra gli stati neuro-frattali degli utenti",
      columns: [
        { name: "id", type: "uuid (PK)", desc: "Identificatore unico riga" },
        { name: "user_id", type: "varchar", desc: "ID utente o 'anonimo'" },
        { name: "state", type: "jsonb", desc: "Coordinate frattali e parametri UI" },
        { name: "cognitive_metrics", type: "jsonb", desc: "Coerenza, Complessità, Adattabilità..." },
        { name: "timestamp", type: "timestamptz", desc: "Data di rilevamento dello stato" },
        { name: "session_id", type: "varchar", desc: "ID sessione audio associata" },
        { name: "encrypted", type: "boolean", desc: "Se i parametri sono crittografati" },
      ],
    },
    {
      name: "admin_collab_users",
      desc: "Utenti admin e collaboratori abilitati",
      columns: [
        { name: "id", type: "uuid (PK)", desc: "Identificatore unico utente" },
        { name: "username", type: "varchar (UQ)", desc: "Nome utente unico" },
        { name: "role", type: "varchar", desc: "Ruolo ('admin' | 'collaborator')" },
        { name: "status", type: "varchar", desc: "Stato approvazione ('pending' | 'accepted')" },
        { name: "permissions", type: "jsonb", desc: "Abilitazioni: canViewStats, canAccessAdmin..." },
        { name: "credentials", type: "jsonb", desc: "Credenziali d'accesso (se non federate)" },
        { name: "telegramChatId", type: "varchar", desc: "Chat ID Telegram inserito dall'utente" },
        { name: "telegramEnabled", type: "boolean", desc: "Notifiche Telegram attive (toggle admin)" },
        { name: "created_at", type: "timestamptz", desc: "Data creazione record" },
      ],
    },
    {
      name: "admin_feedbacks",
      desc: "Feedback lasciati dagli utenti",
      columns: [
        { name: "id", type: "uuid (PK)", desc: "Identificatore unico feedback" },
        { name: "user_id", type: "varchar", desc: "ID utente mittente" },
        { name: "text", type: "text", desc: "Messaggio del feedback" },
        { name: "rating", type: "int4", desc: "Punteggio di gradimento (1-5)" },
        { name: "category", type: "varchar", desc: "Categoria ('bug' | 'suggestion' | 'other')" },
        { name: "timestamp", type: "timestamptz", desc: "Data di invio del feedback" },
      ],
    },
  ];
  const [showFullKey, setShowFullKey] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead
        icon={Database}
        label="Supabase DB & Analytics"
        color="#3ecf8e"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                color: counts?.active ? "#3ecf8e" : "rgba(255,255,255,0.2)",
              }}
            >
              {counts?.active ? "ONLINE" : "OFFLINE"}
            </span>
            <RefreshBtn onClick={fetchSupabase} loading={loading} />
          </div>
        }
      />

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          gap: 10,
        }}
      >
        {[
          { id: "status", label: "config & stato" },
          { id: "data", label: "dati & log" },
          { id: "schema", label: "schema & chiavi" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #3ecf8e"
                  : "2px solid transparent",
              color:
                activeTab === tab.id ? "#3ecf8e" : "rgba(255,255,255,0.35)",
              fontFamily: "monospace",
              fontSize: 10,
              textTransform: "uppercase",
              padding: "6px 4px",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? 700 : 400,
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !counts ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : err ? (
        <Empty icon={AlertCircle} text={err} />
      ) : (
        <>
          {activeTab === "status" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <PLabel>impostazioni di connessione</PLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <KV k="Project Ref ID" v={projectId} />
                <KV k="Supabase Endpoint" v={url || "Non configurato"} />
                <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 7, padding: "5px 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)" }}>Chiave Anon (Client)</span>
                    <button onClick={() => setShowFullKey(!showFullKey)} style={{ background: "none", border: "none", color: "#3ecf8e", fontSize: 8, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase", padding: 0 }}>
                      {showFullKey ? "nascondi" : "mostra"}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                    <code style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.65)", wordBreak: "break-all", whiteSpace: "normal", flex: 1, paddingRight: 6 }}>
                      {anonKey ? showFullKey ? anonKey : `${anonKey.slice(0, 15)}••••••••${anonKey.slice(-10)}` : "Non configurato"}
                    </code>
                    <CopyBtn text={anonKey} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, background: "rgba(0,0,0,0.22)", borderRadius: 7, padding: "4px 8px" }}>
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)" }}>Latenza DB Ping</span>
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: latencyColor(latency), fontWeight: 700 }}>
                    {latency >= 0 ? `${latency} ms` : "Offline/Nessuna risposta"}
                  </span>
                </div>
              </div>
              <PLabel>sicurezza & persistenza</PLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 8, padding: "6px 8px" }}>
                  <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0, textTransform: "uppercase" }}>Sicurezza RLS</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#3ecf8e", margin: "2px 0 0 0" }}>🔐 ABILITATO</p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 8, padding: "6px 8px" }}>
                  <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0, textTransform: "uppercase" }}>Fallback Locale</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: counts?.active ? "#f87171" : "#3ecf8e", margin: "2px 0 0 0" }}>
                    {counts?.active ? "OFF (DB Attivo)" : "ATTIVO (Offline)"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {counts && (
                <div>
                  <PLabel>tabelle & record</PLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                    {[
                      { label: "stati neuro", count: counts.neuro_states, color: "#3ecf8e", bg: "rgba(62,207,142,0.06)", border: "rgba(62,207,142,0.12)" },
                      { label: "collab", count: counts.admin_collab_users, color: "#c084fc", bg: "rgba(192,132,252,0.06)", border: "rgba(192,132,252,0.12)" },
                      { label: "feedback", count: counts.admin_feedbacks, color: "#fb923c", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.12)" },
                    ].map(({ label, count, color, bg, border }) => (
                      <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "6px 8px", textAlign: "center" }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color, margin: 0 }}>{count}</p>
                        <p style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <PLabel>ultimi stati cognitivi (neuro_states)</PLabel>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)" }}>realtime</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                  {recentStates.length === 0 ? (
                    <Empty icon={Activity} text="Nessuno stato neuro loggato nel database" />
                  ) : (
                    recentStates.map((state) => {
                      const m = state.cognitive_metrics;
                      return (
                        <div key={state.id} style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, padding: "7px 9px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                              ID: {state.user_id ? state.user_id.slice(0, 8) + "..." : "anonimo"}
                            </span>
                            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.22)" }}>{ago(state.timestamp)}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px 6px", marginTop: 4 }}>
                            {[["coh.", m?.coherence], ["comp.", m?.complexity], ["adap.", m?.adaptability], ["res.", m?.resilience], ["creat.", m?.creativity], ["bal.", m?.emotional_balance]].map(([label, val]) => {
                              const num = val !== undefined ? Number(val) : 0;
                              return (
                                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8, fontFamily: "monospace" }}>
                                  <span style={{ color: "rgba(255,255,255,0.2)" }}>{label}</span>
                                  <span style={{ color: num > 0.7 ? "#34d399" : num > 0.4 ? "#fbbf24" : "rgba(255,255,255,0.4)", fontWeight: num > 0.7 ? 700 : 400 }}>{num.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5, borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: 4 }}>
                            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.12)", fontFamily: "monospace" }}>SESS: {state.session_id ? state.session_id.slice(0, 10) + "..." : "—"}</span>
                            {state.encrypted && <span style={{ fontSize: 7, color: "#34d399", background: "rgba(52,211,153,0.08)", padding: "1px 4px", borderRadius: 4, fontWeight: 700 }}>🔐 CRITTOGRAFATO</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "schema" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
              {dbSchema.map((table) => (
                <div key={table.name} style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 10, padding: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <code style={{ fontSize: 10, fontFamily: "monospace", color: "#3ecf8e", fontWeight: 700 }}>{table.name}</code>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>tabella sql</span>
                  </div>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", margin: "0 0 6px 0" }}>{table.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {table.columns.map((col) => (
                      <div key={col.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "rgba(255,255,255,0.015)", padding: "3px 6px", borderRadius: 4 }}>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, marginRight: 6 }}>
                          <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{col.name}</span>
                          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.25)" }}>{col.desc}</span>
                        </div>
                        <code style={{ fontSize: 7, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.15)", padding: "1px 4px", borderRadius: 3, flexShrink: 0 }}>{col.type}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VercelPanel() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [proj, setProj] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [envVars, setEnvVars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [expandedSection, setExpandedSection] = useState<"deploy" | "env" | "domains">("deploy");

  const vToken = import.meta.env.VITE_VERCEL_TOKEN;
  const teamId = import.meta.env.VITE_VERCEL_TEAM_ID ?? "";
  const projectName = import.meta.env.VITE_VERCEL_PROJECT ?? "";

  const fetchVercel = useCallback(async () => {
    if (!vToken) { setLoading(false); return; }
    setLoading(true);
    setErr("");
    try {
      const qs = new URLSearchParams({ limit: "8" });
      if (teamId) qs.set("teamId", teamId);
      if (projectName) qs.set("app", projectName);
      const headers = { Authorization: `Bearer ${vToken}` };
      const teamParam = teamId ? `?teamId=${teamId}` : "";
      const [depRes, projRes, domRes, envRes] = await Promise.all([
        fetch(`https://api.vercel.com/v6/deployments?${qs}`, { headers }),
        projectName ? fetch(`https://api.vercel.com/v9/projects/${projectName}${teamParam}`, { headers }) : Promise.resolve(null),
        projectName ? fetch(`https://api.vercel.com/v9/projects/${projectName}/domains${teamParam}`, { headers }) : Promise.resolve(null),
        projectName ? fetch(`https://api.vercel.com/v9/projects/${projectName}/env${teamParam}`, { headers }) : Promise.resolve(null),
      ]);
      if (depRes.ok) setDeployments((await depRes.json()).deployments ?? []);
      if (projRes && projRes.ok) setProj(await projRes.json());
      if (domRes && domRes.ok) setDomains((await domRes.json()).domains ?? []);
      if (envRes && envRes.ok) setEnvVars((await envRes.json()).envs ?? []);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  }, [vToken, teamId, projectName]);

  useEffect(() => { fetchVercel(); }, [fetchVercel]);

  const sc = (s: string) => {
    if (s === "READY") return { c: "#6ee7b7", bg: "rgba(16,185,129,0.1)" };
    if (s === "ERROR" || s === "CANCELED") return { c: "#fca5a5", bg: "rgba(239,68,68,0.1)" };
    if (s === "BUILDING") return { c: "#fcd34d", bg: "rgba(245,158,11,0.12)" };
    return { c: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <PHead icon={Server} label="Vercel Deploy & Config" color="#fbbf24" right={vToken ? <RefreshBtn onClick={fetchVercel} loading={loading} /> : undefined} />
      {!vToken ? (
        <div style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.14)", borderRadius: 11, padding: "10px 13px" }}>
          <p style={{ fontSize: 11, color: "rgba(252,211,77,0.8)", margin: 0 }}>Aggiungi <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 5px", borderRadius: 4, fontSize: 9 }}>VITE_VERCEL_TOKEN</code> al .env</p>
        </div>
      ) : err ? (
        <Empty icon={AlertCircle} text={err} />
      ) : loading ? (
        <Empty icon={Spinner as any} text="caricamento…" />
      ) : (
        <>
          {proj && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 6, marginBottom: 8 }}>
              {[["Framework", proj.framework ?? "React/Vite"], ["Node Version", proj.nodeVersion ?? "20.x"], ["Production Branch", proj.link?.productionBranch ?? "main"], ["Alias Principale", proj.alias?.[0] ?? "—"], ["Creato il", fmtDate(proj.createdAt)]].map(([k, v]) => <KV key={k} k={k} v={v} />)}
            </div>
          )}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 8, gap: 10 }}>
            {[{ id: "deploy", label: "deployments", count: deployments.length }, { id: "domains", label: "domini", count: domains.length }, { id: "env", label: "variabili env", count: envVars.length }].map((tab) => (
              <button key={tab.id} onClick={() => setExpandedSection(tab.id as any)} style={{ background: "none", border: "none", borderBottom: expandedSection === tab.id ? "2px solid #fbbf24" : "2px solid transparent", color: expandedSection === tab.id ? "#fbbf24" : "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", padding: "6px 8px", cursor: "pointer", fontWeight: expandedSection === tab.id ? 700 : 400, display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                {tab.label}
                <span style={{ fontSize: 8, background: expandedSection === tab.id ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 99, color: expandedSection === tab.id ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>{tab.count}</span>
              </button>
            ))}
          </div>
          {expandedSection === "deploy" && (
            <div>
              <PLabel>ultimi deploy</PLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                {deployments.length === 0 ? <Empty icon={Server} text="nessun deploy trovato" /> : deployments.map((d) => {
                  const s = sc(d.state);
                  return (
                    <div key={d.uid} style={{ background: "rgba(0,0,0,0.24)", borderRadius: 11, padding: "8px 11px", border: "1px solid rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700, background: s.bg, color: s.c, padding: "2px 7px", borderRadius: 5 }}>{d.state}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                        <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{ago(new Date(d.createdAt).toISOString())}</span>
                      </div>
                      {d.meta?.githubCommitMessage && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                          <GitBranch size={9} color="rgba(255,255,255,0.18)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{d.meta.githubCommitMessage}</span>
                          {d.meta?.githubCommitSha && <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>{d.meta.githubCommitSha.slice(0, 7)}</span>}
                        </div>
                      )}
                      {d.url && <a href={`https://${d.url}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 9, color: "rgba(96,165,250,0.5)", textDecoration: "none" }}><Globe size={9} /> {d.url}</a>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {expandedSection === "domains" && (
            <div>
              <PLabel>domini configurati</PLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                {domains.length === 0 ? <Empty icon={Globe} text="nessun dominio trovato" /> : domains.map((d) => (
                  <div key={d.name} style={{ background: "rgba(0,0,0,0.24)", borderRadius: 11, padding: "8px 11px", border: "1px solid rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <a href={`https://${d.name}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}><Globe size={11} /> {d.name}</a>
                      <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>Apex: {d.apexName}</span>
                        {d.redirect && <span style={{ fontSize: 8, color: "rgba(251,191,36,0.7)" }}>Redirect to {d.redirect}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: d.verified ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)", color: d.verified ? "#34d399" : "#f87171" }}>{d.verified ? "VERIFICATO" : "NON VERIFICATO"}</span>
                      <CopyBtn text={d.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expandedSection === "env" && (
            <div>
              <PLabel>variabili d'ambiente (configurate su vercel)</PLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                {envVars.length === 0 ? <Empty icon={Key} text="nessuna variabile env trovata" /> : envVars.map((ev) => (
                  <div key={ev.id} style={{ background: "rgba(0,0,0,0.22)", borderRadius: 9, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255,255,255,0.015)" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Lock size={10} color="rgba(255,255,255,0.25)" />
                        <code style={{ fontSize: 10, fontFamily: "monospace", color: "#6ee7b7", fontWeight: 700 }}>{ev.key}</code>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>tipo: {ev.type}</span>
                        {ev.target && ev.target.map((t: string) => <span key={t} style={{ fontSize: 7, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", padding: "1px 5px", borderRadius: 4 }}>{t}</span>)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)" }}>••••••••</span>
                      <CopyBtn text={ev.key} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Topbar({ session, onLogout, onShowShortcuts, onRefreshAll }: { session: AdminSession; onLogout: () => void; onShowShortcuts: () => void; onRefreshAll: () => void }) {
  const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 60000));
  const [now, setNow] = useState(new Date().toLocaleTimeString("it-IT"));
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString("it-IT")), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="admin-topbar">
      <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Shield size={13} color="#34d399" />
      </div>
      <div>
        <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>Music Hub</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.2 }}>Admin Panel</p>
      </div>
      <div className="admin-topbar-actions">
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.2)", letterSpacing: 1 }}>{now}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.28)" }}>
          <User size={10} color="rgba(52,211,153,0.6)" />
          <span style={{ color: "rgba(110,231,183,0.7)" }}>{session.username}</span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
          <Clock size={9} />
          <span>{remaining}m</span>
        </div>
        <button onClick={onRefreshAll} title="Refresh (R)" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
          <RefreshCw size={11} /> Refresh
        </button>
        <button onClick={onShowShortcuts} title="Shortcuts (?)" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
          <Keyboard size={11} /> ?
        </button>
        <button onClick={onLogout} title="Logout (Ctrl+L)" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 7, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "rgba(248,113,113,0.7)", fontSize: 10, fontFamily: "inherit" }}>
          <LogOut size={11} /> Esci
        </button>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  session: AdminSession;
  onLogout: () => void;
}

export default function AdminDashboard({ session, onLogout }: AdminDashboardProps) {
  const handleLogout = () => { clearAdminSession(); onLogout(); };
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<CollabUser | null>(null);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const hash = await sha256hex(session.username.trim());
      const raw = import.meta.env.VITE_ADMIN_CREDENTIALS ?? "";
      if (raw) {
        const pairs = raw.split(",").map((pair: string) => pair.split(":")[0]?.trim());
        if (pairs.includes(hash)) {
          setIsSuper(true);
          return;
        }
      }
      const users = await getCollabUsers();
      const me = users.find(u => u.credentials?.username?.toLowerCase() === session.username.toLowerCase() && u.id !== "system_settings");
      if (me) {
        setCurrentUser(me);
      }
    };
    checkUser();
  }, [session.username, refreshKey]);

  const hasAccessInfra = isSuper || (currentUser?.permissions?.canAccessInfrastructure ?? false);
  const hasModifySettings = isSuper || (currentUser?.permissions?.canModifySettings ?? false);
  const hasModifyGlobal = isSuper || (currentUser?.permissions?.canModifyGlobalSettings ?? false);

  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?" || e.key === "/") { e.preventDefault(); setShowShortcuts((v) => !v); return; }
      if (e.key === "Escape") { setShowShortcuts(false); return; }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); setRefreshKey((v) => v + 1); return; }
      if (e.key === "1") { scrollTo(sec1); return; }
      if (e.key === "2") { scrollTo(sec2); return; }
      if (e.key === "3") { scrollTo(sec3); return; }
      if (e.key === "4") { scrollTo(sec4); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "l") { e.preventDefault(); handleLogout(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ height: "100vh", overflowY: "auto", background: "radial-gradient(circle at top right, #0a1930 0%, #030816 100%)" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.03, backgroundImage: "linear-gradient(#38bdf8 1px,transparent 1px),linear-gradient(90deg,#38bdf8 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
      <Topbar session={session} onLogout={handleLogout} onShowShortcuts={() => setShowShortcuts(true)} onRefreshAll={() => setRefreshKey((v) => v + 1)} />
      <div key={refreshKey} className="admin-container" style={{ position: "relative", padding: 14 }}>
        <div ref={sec1} style={{ scrollMarginTop: 60 }}>
          <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>① Autenticazione & Riproduzione</p>
          <div className="admin-grid-1">
            <Panel delay={0.04}><TokenPanel /></Panel>
            <Panel delay={0.08}><NowPlayingPanel /></Panel>
            <Panel delay={0.12}><ConnectedUsersPanel /></Panel>
          </div>
        </div>
        <div ref={sec2} style={{ scrollMarginTop: 60 }}>
          <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>② Statistiche Spotify</p>
          <div className="admin-grid-2">
            <Panel delay={0.16}><TopTracksPanel /></Panel>
            <Panel delay={0.2}><TopArtistsPanel /></Panel>
            <Panel delay={0.24}><QueuePanel /></Panel>
            <Panel delay={0.28}><LibraryPanel /></Panel>
          </div>
        </div>
        <div ref={sec3} style={{ scrollMarginTop: 60 }}>
          <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>③ Utenti & Comunicazioni</p>
          <div className="admin-grid-3">
            <Panel delay={0.3}>
              <UsersPermissionsPanel 
                session={session} 
                isSuper={isSuper} 
                currentUser={currentUser} 
                hasModifySettings={hasModifySettings} 
                hasModifyGlobal={hasModifyGlobal} 
              />
            </Panel>
            <Panel delay={0.34}><MessagesPanel /></Panel>
            <Panel delay={0.36}><FeedbackPanel /></Panel>
            <Panel delay={0.38}><RecentPanel /></Panel>
          </div>
        </div>
        {hasAccessInfra && (
          <div ref={sec4} style={{ scrollMarginTop: 60 }}>
            <p style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>④ Infrastruttura</p>
            <div className="admin-grid-4">
              <Panel delay={0.42}><SystemPanel /></Panel>
              <Panel delay={0.44}><SupabasePanel /></Panel>
              <Panel delay={0.46}><VercelPanel /></Panel>
            </div>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.07)", paddingBottom: 20, paddingTop: 4 }}>
        ADMIN · RESTRICTED · {new Date().toLocaleDateString("it-IT")} · Press ? for shortcuts
      </p>
      <AnimatePresence>{showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}</AnimatePresence>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        .admin-topbar { display:flex; align-items:center; gap:12px; padding:10px 18px; border-bottom:1px solid rgba(56,189,248,0.2); background:rgba(5,10,25,0.85); backdrop-filter:blur(20px); position:sticky; top:0; z-index:20; box-shadow:0 4px 30px rgba(0,0,0,0.5); }
        .admin-topbar-actions { margin-left:auto; display:flex; align-items:center; gap:14px; }
        .admin-grid-1 { display:grid; grid-template-columns:1.5fr 1fr 1.2fr; gap:11px; margin-bottom:11px; }
        .admin-grid-2 { display:grid; grid-template-columns:1.2fr 1fr 1fr 1fr; gap:11px; margin-bottom:11px; }
        .admin-grid-3 { display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:11px; margin-bottom:11px; }
        .admin-grid-4 { display:grid; grid-template-columns:1fr 1.2fr 1.8fr; gap:11px; margin-bottom:16px; }
        .admin-credentials-row { display:flex; gap:6px; }
        @media (max-width:1200px) { .admin-grid-1,.admin-grid-2,.admin-grid-3,.admin-grid-4 { grid-template-columns:1fr 1fr; } }
        @media (max-width:960px) { .admin-container { padding:10px !important; } .admin-grid-1,.admin-grid-2,.admin-grid-3,.admin-grid-4 { grid-template-columns:1fr; gap:14px; } .admin-topbar { flex-direction:column; align-items:stretch; gap:12px; padding:12px 14px; } .admin-topbar-actions { margin-left:0; width:100%; justify-content:flex-start; flex-wrap:wrap; gap:10px; } }
        @media (max-width:600px) { .admin-credentials-row { flex-direction:column; gap:8px; } .admin-topbar-actions { justify-content:space-between; } }
      `}</style>
    </div>
  );
}
