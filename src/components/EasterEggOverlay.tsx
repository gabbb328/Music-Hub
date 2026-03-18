import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music2, Music, PartyPopper, Heart, Terminal,
  Disc3, Cat, Sparkles, X, ChevronRight, Code2, HeartHandshake, Rainbow
} from "lucide-react";
import type { EasterEggType } from "@/hooks/useEasterEgg";

interface Props {
  egg: EasterEggType;
  onDismiss?: () => void;
}

export const SFONDO_EGGS: EasterEggType[] = ["rainbow", "lgbt", "matrix", "disco", "nyan"];

function playDuh() {
  try {
    const audio = new Audio("/audio/DUHH.mp3");
    audio.loop = false; audio.volume = 1.0;
    audio.play().catch(() => {});
    audio.addEventListener("ended", () => { audio.src = ""; }, { once: true });
  } catch {}
}

// ── Confetti canvas ───────────────────────────────────────────────────────────
function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const p = Array.from({ length: 200 }, () => ({
      x: Math.random() * c.width, y: Math.random() * -c.height,
      r: Math.random() * 8 + 4, d: Math.random() * 4 + 1,
      color: `hsl(${Math.random() * 360},90%,60%)`,
      spin: Math.random() * 0.3 - 0.15, angle: 0, dx: Math.random() * 2 - 1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      p.forEach(q => {
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.angle);
        ctx.fillStyle = q.color; ctx.fillRect(-q.r/2, -q.r/2, q.r, q.r*2.5);
        ctx.restore();
        q.y += q.d; q.x += q.dx; q.angle += q.spin;
        if (q.y > c.height) { q.y = -20; q.x = Math.random() * c.width; }
      });
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 9991 }} />;
}

// ── Matrix canvas ─────────────────────────────────────────────────────────────
function MatrixCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const cols = Math.floor(c.width / 16);
    const drops = Array(cols).fill(0);
    const chars = "アイウエオカキクケコ0123456789ABCDEF";
    let raf: number;
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#00ff41"; ctx.font = "14px monospace";
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, y * 16);
        if (y * 16 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 6, opacity: 0.6 }} />;
}

// ── Icone fluttuanti ──────────────────────────────────────────────────────────
function FloatingIcons({ icon: Icon, color, count = 16 }: {
  icon: React.ComponentType<any>; color: string; count?: number;
}) {
  const items = Array.from({ length: count }, (_, i) => ({
    id: i, left: `${3 + Math.random() * 94}%`,
    delay: Math.random() * 2.5, dur: 2.5 + Math.random() * 2, size: 20 + Math.random() * 24,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9992 }}>
      {items.map(h => (
        <motion.div key={h.id}
          initial={{ y: "110vh", opacity: 1, scale: 0.4 }}
          animate={{ y: "-10vh", opacity: [1, 1, 0], scale: 1 }}
          transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: "easeOut" }}
          style={{ position: "absolute", left: h.left, bottom: 0 }}>
          <Icon size={h.size} color={color} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HACK TERMINAL — narrativa completa con script NASA, access denied, poi accesso
// ══════════════════════════════════════════════════════════════════════════════

// Ogni entry: { text, color, delay (ms dall'inizio), indent }
type TermLine = { text: string; color: string; delay: number; bold?: boolean };

const HACK_SCRIPT: TermLine[] = [
  // Avvio sistema
  { text: "root@kali:~# uname -a", color: "#00ff41", delay: 0 },
  { text: "Linux kali 6.1.0-kali5-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux", color: "#aaaaaa", delay: 180 },
  { text: "", color: "", delay: 300 },

  // Scansione
  { text: "root@kali:~# nmap -sS -O -p 1-65535 nasa.gov", color: "#00ff41", delay: 350 },
  { text: "Starting Nmap 7.94 ( https://nmap.org )", color: "#888888", delay: 530 },
  { text: "Initiating SYN Stealth Scan at 03:47", color: "#888888", delay: 660 },
  { text: "Scanning nasa.gov (192.0.2.101) [65535 ports]", color: "#888888", delay: 790 },
  { text: "Discovered open port 22/tcp   on 192.0.2.101", color: "#00cc33", delay: 980 },
  { text: "Discovered open port 80/tcp   on 192.0.2.101", color: "#00cc33", delay: 1100 },
  { text: "Discovered open port 443/tcp  on 192.0.2.101", color: "#00cc33", delay: 1200 },
  { text: "Discovered open port 8443/tcp on 192.0.2.101  [CLASSIFIED]", color: "#ffaa00", delay: 1320 },
  { text: "Nmap done: 1 IP address (1 host up) scanned in 2.47 seconds", color: "#888888", delay: 1480 },
  { text: "", color: "", delay: 1550 },

  // Download exploit
  { text: "root@kali:~# wget https://exploit-db.com/raw/nasa_auth_bypass_v4.py", color: "#00ff41", delay: 1600 },
  { text: "--2024-11-13 03:47:33--  https://exploit-db.com/raw/nasa_auth_bypass_v4.py", color: "#888888", delay: 1750 },
  { text: "Resolving exploit-db.com... 192.168.1.1", color: "#888888", delay: 1900 },
  { text: "HTTP request sent, awaiting response... 200 OK", color: "#888888", delay: 2050 },
  { text: "Length: 48291 (47K) [text/plain]", color: "#888888", delay: 2150 },
  { text: "Saving to: 'nasa_auth_bypass_v4.py'", color: "#888888", delay: 2250 },
  { text: "nasa_auth_bypass_v4.py    100%[=============================>]  47.16K  --.-KB/s  in 0.08s", color: "#00cc33", delay: 2400 },
  { text: "", color: "", delay: 2520 },

  // Exploit
  { text: "root@kali:~# python3 nasa_auth_bypass_v4.py --target nasa.gov --port 8443", color: "#00ff41", delay: 2570 },
  { text: "[*] Initializing NASA Authentication Bypass v4.0", color: "#888888", delay: 2750 },
  { text: "[*] Target: nasa.gov:8443", color: "#888888", delay: 2870 },
  { text: "[*] Loading payload modules...", color: "#888888", delay: 2990 },
  { text: "[+] CVE-2024-31337: Buffer overflow in auth_handler → LOADED", color: "#00cc33", delay: 3110 },
  { text: "[+] CVE-2024-29182: JWT secret bypass → LOADED", color: "#00cc33", delay: 3230 },
  { text: "[+] CVE-2024-27741: SQL injection in login endpoint → LOADED", color: "#00cc33", delay: 3350 },
  { text: "[*] Sending crafted payload to /api/v3/auth...", color: "#888888", delay: 3520 },
  { text: "[*] ████████████████████████ 100%  Exploiting...", color: "#ffaa00", delay: 3700 },
  { text: "", color: "", delay: 3850 },

  // ← ACCESS DENIED (rosso, bold)
  { text: "╔══════════════════════════════════════════╗", color: "#ff3333", delay: 3900, bold: true },
  { text: "║  ⚠  ACCESSO NEGATO — SISTEMA NASA SICURO ⚠  ║", color: "#ff3333", delay: 3940, bold: true },
  { text: "║  Unauthorized access attempt detected.       ║", color: "#ff3333", delay: 3980, bold: true },
  { text: "║  FBI TRACE INITIATED — IP LOGGED             ║", color: "#ff3333", delay: 4020, bold: true },
  { text: "╚══════════════════════════════════════════╝", color: "#ff3333", delay: 4060, bold: true },
  { text: "", color: "", delay: 4140 },

  // Secondo tentativo — con pipe e Billie
  { text: "root@kali:~# python3 nasa_auth_bypass_v4.py --target nasa.gov \\", color: "#00ff41", delay: 4250 },
  { text: "    --port 8443 --bypass-fbi \\", color: "#00ff41", delay: 4310 },
  { text: "    | python3 play_billie.py --song 'bad_guy' --volume 100 \\", color: "#00ff41", delay: 4370 },
  { text: "    | ./unlock_nasa_mainframe.sh --force", color: "#00ff41", delay: 4430 },
  { text: "", color: "", delay: 4500 },
  { text: "[*] Reinitializing attack pipeline...", color: "#888888", delay: 4560 },
  { text: "[*] Injecting Billie Eilish audio signature into auth token...", color: "#888888", delay: 4720 },
  { text: "[*] DUH frequency: 65Hz — matching NASA secret passphrase hash...", color: "#888888", delay: 4900 },
  { text: "[+] Hash match confirmed: duh == 0xDEADC0DEBAD1DEA5", color: "#00cc33", delay: 5100 },
  { text: "[*] Sending override packet with audio fingerprint...", color: "#888888", delay: 5280 },
  { text: "[*] ████████████████████████ 100%  Bypassing security...", color: "#ffaa00", delay: 5460 },
  { text: "", color: "", delay: 5620 },

  // ← ACCESS GRANTED (verde, bold)
  { text: "╔══════════════════════════════════════════╗", color: "#00ff41", delay: 5680, bold: true },
  { text: "║  ✓  ACCESSO GARANTITO — BENVENUTO, HACKER  ║", color: "#00ff41", delay: 5720, bold: true },
  { text: "║  NASA Mainframe v9.1 — ALL SYSTEMS ONLINE   ║", color: "#00ff41", delay: 5760, bold: true },
  { text: "║  Billie Eilish auth: ACCEPTED ♪             ║", color: "#00ff41", delay: 5800, bold: true },
  { text: "╚══════════════════════════════════════════╝", color: "#00ff41", delay: 5840, bold: true },
  { text: "", color: "", delay: 5900 },
  { text: "root@nasa-mainframe:~# ls /classified/", color: "#00ff41", delay: 5950 },
  { text: "aliens/    moon_landing_truth/    area51/    billie_eilish_fanclub/", color: "#aaaaaa", delay: 6100 },
  { text: "root@nasa-mainframe:~# cat moon_landing_truth/README.txt", color: "#00ff41", delay: 6280 },
  { text: "\"Sì, siamo davvero andati sulla luna. E ci siamo portati Bad Guy.\"", color: "#ffaa00", delay: 6450, bold: true },
  { text: "                                                 — Neil Armstrong, 1969", color: "#888888", delay: 6600 },
];

// Terminale con righe che appaiono una per una
function HackTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    HACK_SCRIPT.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), line.delay));
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Auto-scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  return (
    // Terminale: sfondo nero pieno, padding realistico, scroll interno
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 9992, background: "#0a0a0a" }}
    >
      {/* Titlebar stile terminale */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0"
        style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-gray-500 font-mono">root@kali — bash — 120×40</span>
      </div>

      {/* Output terminale con scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ fontFamily: "monospace" }}>
        {HACK_SCRIPT.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            className="leading-5 text-xs md:text-sm whitespace-pre-wrap break-all"
            style={{
              color: line.color || "transparent",
              fontWeight: line.bold ? "bold" : "normal",
              // Righe vuote hanno altezza minima per preservare lo spazio
              minHeight: line.text === "" ? "0.75rem" : undefined,
            }}
          >
            {line.text}
          </div>
        ))}
        {/* Cursore lampeggiante */}
        {visibleCount > 0 && visibleCount < HACK_SCRIPT.length && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-4 align-middle"
            style={{ background: "#00ff41" }}
          />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Lista Easter Egg ──────────────────────────────────────────────────────────
export function EasterEggList({ onClose, onActivate }: {
  onClose: () => void;
  onActivate: (egg: EasterEggType) => void;
}) {
  const eggs = [
    { egg:"duh" as EasterEggType,     icon:Music2,         color:"#a3e635", bg:"bg-lime-500/15",   name:"Bad Guy",     keyword:"duh",     desc:'Il "duh" di Billie Eilish + audio',  sfondo:false },
    { egg:"party" as EasterEggType,   icon:PartyPopper,    color:"#f59e0b", bg:"bg-amber-500/15",  name:"Party Time",  keyword:"party",   desc:"Coriandoli ovunque!",                sfondo:false },
    { egg:"rainbow" as EasterEggType, icon:Rainbow,        color:"#22d3ee", bg:"bg-cyan-500/15",   name:"Rainbow",     keyword:"rainbow", desc:"Sfondo arcobaleno (15s)",            sfondo:true  },
    { egg:"lgbt" as EasterEggType,    icon:HeartHandshake, color:"#ec4899", bg:"bg-pink-500/15",   name:"Pride",       keyword:"lgbt",    desc:"Bandiera pride di sfondo (15s)",     sfondo:true  },
    { egg:"matrix" as EasterEggType,  icon:Code2,          color:"#00ff41", bg:"bg-green-500/15",  name:"Matrix",      keyword:"matrix",  desc:"Pioggia di codice (15s)",            sfondo:true  },
    { egg:"disco" as EasterEggType,   icon:Disc3,          color:"#a855f7", bg:"bg-purple-500/15", name:"Disco Fever", keyword:"disco",   desc:"Luci disco di sfondo (15s)",         sfondo:true  },
    { egg:"nyan" as EasterEggType,    icon:Cat,            color:"#f472b6", bg:"bg-pink-400/15",   name:"Nyan Cat",    keyword:"nyan",    desc:"Nyan Cat vola sullo sfondo (15s)",   sfondo:true  },
    { egg:"hack" as EasterEggType,    icon:Terminal,       color:"#4ade80", bg:"bg-green-400/15",  name:"Hacker",      keyword:"hack",    desc:"Hackeraggio NASA con Billie Eilish", sfondo:false },
    { egg:"love" as EasterEggType,    icon:Heart,          color:"#f87171", bg:"bg-red-400/15",    name:"Love",        keyword:"love",    desc:"Cuori che piovono",                  sfondo:false },
    { egg:"music" as EasterEggType,   icon:Music,          color:"#818cf8", bg:"bg-indigo-400/15", name:"Music Life",  keyword:"music",   desc:"Note musicali fluttuanti",           sfondo:false },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-xl flex items-end md:items-center justify-center"
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-sm mx-auto rounded-t-3xl md:rounded-3xl bg-card border border-border/40 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="px-5 pb-3 pt-1 flex items-center justify-between border-b border-border/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Easter Eggs</h2>
              <p className="text-[10px] text-muted-foreground">Cerca queste parole per attivarli</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/10">
          {eggs.map(({ egg, icon: Icon, color, bg, name, keyword, desc, sfondo }) => (
            <motion.button key={egg as string} whileTap={{ scale: 0.97 }}
              onClick={() => { onActivate(egg); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 active:bg-secondary/60 transition-colors text-left">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} color={color} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono">{keyword}</span>
                  {sfondo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-semibold">sfondo 15s</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </motion.button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/20 text-center space-y-0.5">
          <p className="text-[10px] text-muted-foreground/50">Tieni premuto Play/Pause per riaprire questa lista</p>
          <p className="text-[10px] text-sky-400/70">Gli effetti "sfondo 15s" rimangono attivi mentre usi l'app</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function EasterEggOverlay({ egg, onDismiss }: Props) {
  const didSound = useRef(false);

  useEffect(() => {
    if (egg === "duh" && !didSound.current) { didSound.current = true; playDuh(); }
    if (!egg) didSound.current = false;
  }, [egg]);

  useEffect(() => {
    if (!egg) return;
    const ms =
      SFONDO_EGGS.includes(egg)                       ? 15000 :
      ["party","hack","love","music"].includes(egg)   ? 5000  :
      // hack ha la sua durata naturale (script ~7s) + margine
      egg === "hack"                                  ? 9000  :
      null;
    if (ms === null) return;
    const t = setTimeout(() => onDismiss?.(), ms);
    return () => clearTimeout(t);
  }, [egg, onDismiss]);

  if (!egg) return null;

  // ── SFONDO (z basso, pointer-events none) ─────────────────────────────────
  if (SFONDO_EGGS.includes(egg)) {
    return (
      <AnimatePresence>
        <motion.div key={`bg-${egg}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 5 }}>

          {egg === "rainbow" && (
            <motion.div className="absolute inset-0"
              animate={{ background: [
                "linear-gradient(135deg,rgba(255,0,0,0.45),rgba(255,119,0,0.45),rgba(255,255,0,0.45),rgba(0,255,0,0.45),rgba(0,0,255,0.45),rgba(139,0,255,0.45))",
                "linear-gradient(135deg,rgba(255,119,0,0.45),rgba(255,255,0,0.45),rgba(0,255,0,0.45),rgba(0,0,255,0.45),rgba(139,0,255,0.45),rgba(255,0,0,0.45))",
                "linear-gradient(135deg,rgba(255,255,0,0.45),rgba(0,255,0,0.45),rgba(0,0,255,0.45),rgba(139,0,255,0.45),rgba(255,0,0,0.45),rgba(255,119,0,0.45))",
                "linear-gradient(135deg,rgba(0,255,0,0.45),rgba(0,0,255,0.45),rgba(139,0,255,0.45),rgba(255,0,0,0.45),rgba(255,119,0,0.45),rgba(255,255,0,0.45))",
              ] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          )}

          {egg === "lgbt" && (
            <div className="absolute inset-0 flex flex-col" style={{ opacity: 0.4 }}>
              {["#FF0018","#FFA52C","#FFFF41","#008018","#0000F9","#86007D"].map((color, i) => (
                <motion.div key={i} className="flex-1"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  style={{ background: color, transformOrigin: "left" }} />
              ))}
            </div>
          )}

          {egg === "matrix" && <div className="absolute inset-0 bg-black/80" />}

          {egg === "disco" && (
            <motion.div className="absolute inset-0"
              animate={{ background: ["rgba(0,0,0,0.7)","rgba(21,0,37,0.8)","rgba(0,0,0,0.7)","rgba(0,23,0,0.8)","rgba(0,0,0,0.7)"] }}
              transition={{ duration: 1.2, repeat: Infinity }} />
          )}

          {egg === "nyan" && (
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom,rgba(0,0,51,0.7),rgba(0,0,102,0.7))" }} />
          )}
        </motion.div>

        {egg === "matrix" && <MatrixCanvas />}

        {egg === "nyan" && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 6 }}>
            <motion.div
              initial={{ x: "-20vw", y: "42vh" }} animate={{ x: "120vw" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute flex items-center">
              <div style={{
                width: 240, height: 18,
                background: "linear-gradient(to left,transparent,rgba(255,0,0,0.9),rgba(255,165,0,0.9),rgba(255,255,0,0.9),rgba(0,128,0,0.9),rgba(0,0,255,0.9),rgba(238,130,238,0.9))",
                borderRadius: 4,
              }} />
              <div style={{
                width: 56, height: 56, borderRadius: "50% 50% 40% 40%",
                background: "#f9a8d4", border: "3px solid #fbcfe8",
                boxShadow: "0 0 12px rgba(249,168,212,0.6)",
              }} />
            </motion.div>
          </div>
        )}

        {egg === "disco" && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden" style={{ zIndex: 6 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ width: 160, height: 160, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.15)" }} />
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div key={i} className="absolute rounded-full"
                style={{ width: 16, height: 16, background: `hsl(${i*45},100%,60%)`, boxShadow: `0 0 20px 8px hsl(${i*45},100%,60%)` }}
                animate={{
                  x: [0, Math.cos(i*45*Math.PI/180)*280],
                  y: [0, Math.sin(i*45*Math.PI/180)*220],
                  opacity: [0, 0.85, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i*0.18, ease: "easeOut" }} />
            ))}
          </div>
        )}

        {/* Pulsante chiudi sfondo */}
        <motion.div key={`close-${egg}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.7 }}
          className="fixed flex flex-col items-end gap-1.5"
          style={{ zIndex: 49, pointerEvents: "auto", bottom: "5.5rem", right: "1rem" }}>
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <motion.div className="h-1 rounded-full bg-white/60"
              initial={{ width: 52 }} animate={{ width: 0 }}
              transition={{ duration: 15, ease: "linear" }} />
            <span className="text-white/60 text-[10px] font-mono whitespace-nowrap">15s</span>
          </div>
          <button onClick={e => { e.stopPropagation(); onDismiss?.(); }}
            className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/90 px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
            <X className="w-3.5 h-3.5" /> Chiudi
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── OVERLAY (z alto, copre tutto) ─────────────────────────────────────────
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990]" onClick={onDismiss}>
      {children}
      <button onClick={e => { e.stopPropagation(); onDismiss?.(); }}
        className="fixed top-4 right-4 z-[10000] w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );

  // DUH
  if (egg === "duh") return (
    <AnimatePresence><Wrapper>
      <div className="fixed inset-0 bg-black/93 flex flex-col items-center justify-center gap-8 z-[9991]">
        <motion.div className="absolute inset-0 bg-lime-500/5"
          animate={{ opacity: [0.05, 0.18, 0.05] }} transition={{ duration: 0.7, repeat: Infinity }} />
        <motion.div className="absolute w-80 h-80 rounded-full border-2 border-lime-400/20"
          animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 0.7, repeat: Infinity }} />
        <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.7, repeat: Infinity }} className="z-10">
          <Music2 size={80} color="#a3e635" strokeWidth={1} className="drop-shadow-2xl" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.08, 1], color: ["#ffffff","#a3e635","#ffffff"] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="text-[20vw] font-black tracking-tighter leading-none select-none z-10"
          style={{ fontFamily:"Impact,Arial Black,sans-serif", color:"white", textShadow:"0 0 60px rgba(163,230,53,0.5)" }}>
          duh
        </motion.div>
        <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="text-lime-400 text-lg font-semibold tracking-widest uppercase z-10">
          — Billie Eilish, Bad Guy
        </motion.p>
        <div className="flex items-end gap-[3px] h-14 z-10">
          {Array.from({ length: 40 }, (_, i) => {
            const cv = Math.abs(i - 20) / 20;
            return (
              <motion.div key={i} className="w-[5px] rounded-full bg-lime-400"
                animate={{ height: [`${(1-cv)*55+10}%`,`${(1-cv)*85+5}%`,`${(1-cv)*35+15}%`] }}
                transition={{ duration: 0.35, repeat: Infinity, delay: i*0.022, ease: "easeInOut" }}
                style={{ minHeight: 3 }} />
            );
          })}
        </div>
        <p className="text-muted-foreground/50 text-xs z-10">Tocca per chiudere</p>
      </div>
    </Wrapper></AnimatePresence>
  );

  // PARTY
  if (egg === "party") return (
    <AnimatePresence><Wrapper>
      <Confetti />
      <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none gap-6" style={{ zIndex: 9992 }}>
        <motion.div animate={{ scale:[1,1.2,1], rotate:[0,15,-15,0] }} transition={{ duration:0.5, repeat:Infinity }}>
          <PartyPopper size={100} className="text-amber-400 drop-shadow-2xl" strokeWidth={1} />
        </motion.div>
        <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="text-4xl font-black text-white drop-shadow-2xl tracking-tight">
          PARTY TIME!!!
        </motion.p>
      </div>
    </Wrapper></AnimatePresence>
  );

  // HACK — terminale narrativo completo
  if (egg === "hack") return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9990]">
        <HackTerminal />
        {/* X in alto a destra */}
        <button onClick={e => { e.stopPropagation(); onDismiss?.(); }}
          className="fixed top-12 right-4 z-[10000] w-11 h-11 rounded-full flex items-center justify-center text-green-400 hover:text-white hover:bg-white/10 transition-colors"
          style={{ border: "1px solid rgba(0,255,65,0.3)" }}>
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );

  // LOVE
  if (egg === "love") return (
    <AnimatePresence><Wrapper>
      <div className="fixed inset-0 bg-black/60" style={{ zIndex: 9991 }} />
      <FloatingIcons icon={Heart} color="#f87171" count={18} />
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 9993 }}>
        <motion.div className="flex flex-col items-center gap-4"
          animate={{ scale:[1,1.08,1] }} transition={{ duration:0.8, repeat:Infinity }}>
          <Heart size={90} className="text-red-400 fill-red-400 drop-shadow-2xl" strokeWidth={1} />
          <p className="text-4xl font-black text-red-300 drop-shadow-2xl">Love</p>
        </motion.div>
      </div>
    </Wrapper></AnimatePresence>
  );

  // MUSIC
  if (egg === "music") return (
    <AnimatePresence><Wrapper>
      <div className="fixed inset-0 bg-black/55" style={{ zIndex: 9991 }} />
      <FloatingIcons icon={Music} color="#818cf8" count={16} />
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 9993 }}>
        <motion.div className="flex flex-col items-center gap-4"
          animate={{ scale:[1,1.1,1], rotate:[-3,3,-3] }} transition={{ duration:1, repeat:Infinity }}>
          <Music2 size={90} className="text-indigo-400 drop-shadow-2xl" strokeWidth={1} />
          <p className="text-4xl font-black text-indigo-300 drop-shadow-2xl">Music is Life</p>
        </motion.div>
      </div>
    </Wrapper></AnimatePresence>
  );

  return null;
}
