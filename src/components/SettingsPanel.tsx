import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sun, Moon, Palette, Sparkles, LogOut, ImageIcon,
  Check, Headphones, Volume2, Settings2, Wifi, Download,
  Zap, Music2, Wind, Bluetooth, ChevronDown, Info,
  ExternalLink, CheckCircle2, RotateCcw, Save,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { clearToken } from "@/services/spotify-auth";
import { useNavigate } from "react-router-dom";
import { usePlaybackState } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────────────────────────────────────
// DATI STATICI
// ─────────────────────────────────────────────────────────────────────────────

const colorThemes = [
  { id: "blue",    name: "Ocean Blue",    color: "hsl(217,91%,60%)"  },
  { id: "purple",  name: "Royal Purple",  color: "hsl(271,91%,65%)"  },
  { id: "violet",  name: "Deep Violet",   color: "hsl(250,85%,70%)"  },
  { id: "emerald", name: "Emerald",       color: "hsl(158,86%,55%)"  },
  { id: "teal",    name: "Teal Wave",     color: "hsl(178,90%,55%)"  },
  { id: "amber",   name: "Golden Amber",  color: "hsl(43,96%,60%)"   },
  { id: "rose",    name: "Rose Garden",   color: "hsl(355,91%,65%)"  },
  { id: "crimson", name: "Crimson Red",   color: "hsl(0,91%,71%)"    },
  { id: "indigo",  name: "Indigo Night",  color: "hsl(239,90%,70%)"  },
  { id: "lime",    name: "Electric Lime", color: "hsl(85,90%,55%)"   },
  { id: "sky",     name: "Sky Blue",      color: "hsl(200,98%,60%)"  },
  { id: "fuchsia", name: "Fuchsia Pink",  color: "hsl(300,91%,73%)"  },
] as const;

const iconsList = [
  { id: "auto",                     name: "Auto",              src: null },
  { id: "app_blu_scuro.png",        name: "Blu Scuro",         src: "/icons/app_blu_scuro.png"        },
  { id: "app_blu_chiaro.png",       name: "Blu Chiaro",        src: "/icons/app_blu_chiaro.png"       },
  { id: "app_viola_scuro.png",      name: "Viola Scuro",       src: "/icons/app_viola_scuro.png"      },
  { id: "app_viola_chiaro.png",     name: "Viola Chiaro",      src: "/icons/app_viola_chiaro.png"     },
  { id: "app_azzurro_scuro.png",    name: "Azzurro Scuro",     src: "/icons/app_azzurro_scuro.png"    },
  { id: "app_azzurro_chiaro.png",   name: "Azzurro Chiaro",    src: "/icons/app_azzurro_chiaro.png"   },
  { id: "app_verde_scuro.png",      name: "Verde Scuro",       src: "/icons/app_verde_scuro.png"      },
  { id: "app_verde_chiaro.png",     name: "Verde Chiaro",      src: "/icons/app_verde_chiaro.png"     },
  { id: "app_arancione_scuro.png",  name: "Arancione Scuro",   src: "/icons/app_arancione_scuro.png"  },
  { id: "app_arancione_chiaro.png", name: "Arancione Chiaro",  src: "/icons/app_arancione_chiaro.png" },
  { id: "app_rosa_scuro.png",       name: "Rosa Scuro",        src: "/icons/app_rosa_scuro.png"       },
  { id: "app_rosa_chiaro.png",      name: "Rosa Chiaro",       src: "/icons/app_rosa_chiaro.png"      },
  { id: "app_rosso_scuro.png",      name: "Rosso Scuro",       src: "/icons/app_rosso_scuro.png"      },
  { id: "app_rosso_chiaro.png",     name: "Rosso Chiaro",      src: "/icons/app_rosso_chiaro.png"     },
];

// Tipi di cuffie supportati
const HEADPHONE_BRANDS = [
  {
    brand: "Samsung",
    models: [
      { id: "buds3pro",  name: "Galaxy Buds3 Pro",   anc: true,  eq: true,  spatial: true,  app: "galaxywearable://" },
      { id: "buds3",     name: "Galaxy Buds3",        anc: true,  eq: true,  spatial: false, app: "galaxywearable://" },
      { id: "buds2pro",  name: "Galaxy Buds2 Pro",    anc: true,  eq: true,  spatial: true,  app: "galaxywearable://" },
      { id: "buds2",     name: "Galaxy Buds2",         anc: true,  eq: true,  spatial: false, app: "galaxywearable://" },
      { id: "budsLive",  name: "Galaxy Buds Live",    anc: true,  eq: true,  spatial: false, app: "galaxywearable://" },
      { id: "budsPro",   name: "Galaxy Buds Pro",     anc: true,  eq: true,  spatial: false, app: "galaxywearable://" },
      { id: "budsPlus",  name: "Galaxy Buds+",        anc: false, eq: false, spatial: false, app: "galaxywearable://" },
    ],
    color: "text-blue-400", bg: "bg-blue-400/10",
    appName: "Galaxy Wearable",
    appAndroid: "galaxywearable://",
    appIos: "https://apps.apple.com/it/app/galaxy-wearable-watch-manager/id1113456516",
    appFallback: "https://play.google.com/store/apps/details?id=com.samsung.accessory",
  },
  {
    brand: "Apple",
    models: [
      { id: "airpods4anc", name: "AirPods 4 (ANC)",   anc: true,  eq: false, spatial: true,  app: "" },
      { id: "airpods4",    name: "AirPods 4",          anc: false, eq: false, spatial: true,  app: "" },
      { id: "airpodspro2", name: "AirPods Pro 2",      anc: true,  eq: false, spatial: true,  app: "" },
      { id: "airpodspro",  name: "AirPods Pro",        anc: true,  eq: false, spatial: true,  app: "" },
      { id: "airpods3",    name: "AirPods 3",          anc: false, eq: false, spatial: true,  app: "" },
      { id: "airpodsmax",  name: "AirPods Max",        anc: true,  eq: false, spatial: true,  app: "" },
      { id: "airpods2",    name: "AirPods 2",          anc: false, eq: false, spatial: false, app: "" },
    ],
    color: "text-slate-300", bg: "bg-slate-300/10",
    appName: "Impostazioni iOS",
    appAndroid: "",
    appIos: "App-prefs:Bluetooth",
    appFallback: "",
  },
  {
    brand: "Sony",
    models: [
      { id: "xm6",    name: "WH-1000XM6",    anc: true,  eq: true, spatial: true,  app: "sonymusicconnect://" },
      { id: "xm5",    name: "WH-1000XM5",    anc: true,  eq: true, spatial: false, app: "sonymusicconnect://" },
      { id: "xm4",    name: "WH-1000XM4",    anc: true,  eq: true, spatial: false, app: "sonymusicconnect://" },
      { id: "wf1000xm5", name: "WF-1000XM5", anc: true,  eq: true, spatial: true,  app: "sonymusicconnect://" },
      { id: "wf1000xm4", name: "WF-1000XM4", anc: true,  eq: true, spatial: false, app: "sonymusicconnect://" },
    ],
    color: "text-orange-400", bg: "bg-orange-400/10",
    appName: "Sony | Headphones Connect",
    appAndroid: "sonymusicconnect://",
    appIos: "sonymusicconnect://",
    appFallback: "https://play.google.com/store/apps/details?id=com.sony.songpal.headphone",
  },
  {
    brand: "Bose",
    models: [
      { id: "qc45",   name: "QuietComfort 45", anc: true,  eq: true, spatial: false, app: "bosemusic://" },
      { id: "qcUE",   name: "QuietComfort Ultra Earbuds", anc: true, eq: true, spatial: true, app: "bosemusic://" },
      { id: "qcUH",   name: "QuietComfort Ultra Headphones", anc: true, eq: true, spatial: true, app: "bosemusic://" },
      { id: "700",    name: "Bose 700",        anc: true,  eq: true, spatial: false, app: "bosemusic://" },
    ],
    color: "text-emerald-400", bg: "bg-emerald-400/10",
    appName: "Bose Music",
    appAndroid: "bosemusic://",
    appIos: "bosemusic://",
    appFallback: "https://play.google.com/store/apps/details?id=com.bose.bosemusic",
  },
  {
    brand: "Jabra",
    models: [
      { id: "elite10",  name: "Jabra Elite 10",  anc: true,  eq: true, spatial: true,  app: "jabrasound://" },
      { id: "elite8",   name: "Jabra Elite 8",   anc: true,  eq: true, spatial: false, app: "jabrasound://" },
      { id: "evolve265",name: "Jabra Evolve2 65",anc: true,  eq: true, spatial: false, app: "jabrasound://" },
    ],
    color: "text-purple-400", bg: "bg-purple-400/10",
    appName: "Jabra Sound+",
    appAndroid: "jabrasound://",
    appIos: "jabrasound://",
    appFallback: "https://play.google.com/store/apps/details?id=com.jabra.ndw.android",
  },
  {
    brand: "Altro / Generico",
    models: [
      { id: "generic", name: "Cuffie generiche", anc: false, eq: true, spatial: false, app: "" },
    ],
    color: "text-muted-foreground", bg: "bg-muted/20",
    appName: "",
    appAndroid: "",
    appIos: "",
    appFallback: "",
  },
];

const EQ_PRESETS = [
  { name: "Normal",       gains: [0,0,0,0,0] },
  { name: "Bass Boost",   gains: [3,2,0,0,0] },
  { name: "Soft",         gains: [-1,-1,0,1,1] },
  { name: "Dynamic",      gains: [1,0,0,0,1] },
  { name: "Clear",        gains: [0,0,0,2,3] },
  { name: "Treble Boost", gains: [0,0,0,2,4] },
];

const QUALITY_LABELS: Record<string, string> = {
  low:       "Bassa (~96 kbps)",
  normal:    "Normale (~160 kbps)",
  high:      "Alta (~320 kbps)",
  very_high: "Molto alta (Lossless)",
};

const IS_ANDROID = /Android/i.test(navigator.userAgent);
const IS_IOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const IS_MOBILE  = IS_ANDROID || IS_IOS;

// ─────────────────────────────────────────────────────────────────────────────
// TIPI
// ─────────────────────────────────────────────────────────────────────────────
type Tab = "aspetto" | "audio" | "cuffie";
type AncMode = "off" | "anc" | "ambient";

interface AudioConfig {
  streamingQuality: "low"|"normal"|"high"|"very_high";
  downloadQuality:  "low"|"normal"|"high"|"very_high";
  crossfadeSec: number;
  loudnessNorm: boolean;
  gaplessPlayback: boolean;
  monoAudio: boolean;
  hardwareAccel: boolean;
  autoplay: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MICRO-COMPONENTI
// ─────────────────────────────────────────────────────────────────────────────
function Toggle({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${value ? "bg-primary" : "bg-secondary"}`}>
        <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: value ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}

function SectionBox({ icon: Icon, title, children }: {
  icon: React.ComponentType<any>; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />{title}
      </h3>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEZIONE ASPETTO
// ─────────────────────────────────────────────────────────────────────────────
function TabAspetto() {
  const {
    theme, colorTheme, setTheme, setColorTheme,
    autoDarkMode, setAutoDarkMode,
    activeAppIcon, setActiveAppIcon,
  } = useTheme();
  const { data: playbackState } = usePlaybackState();
  const coverUrl    = playbackState?.item?.album?.images?.[0]?.url;
  const trackName   = playbackState?.item?.name;
  const artistName  = playbackState?.item?.artists?.[0]?.name;
  const selectedIcon = iconsList.find(i => i.id === activeAppIcon) ?? iconsList[0];

  return (
    <div className="space-y-6">

      {/* Tema */}
      <SectionBox icon={Sun} title="Tema">
        <div className="grid grid-cols-2 gap-3">
          {(["light","dark"] as const).map(t => (
            <motion.button key={t} whileTap={{ scale: 0.97 }} onClick={() => setTheme(t)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
              {t === "light" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              <span className="text-sm font-medium">{t === "light" ? "Chiaro" : "Scuro"}</span>
            </motion.button>
          ))}
        </div>
      </SectionBox>

      {/* Colore */}
      <SectionBox icon={Palette} title="Colore accento">
        {/* Dynamic */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setColorTheme("dynamic")}
          className={`w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden ${colorTheme === "dynamic" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
          {coverUrl ? (
            <>
              <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30" style={{ backgroundImage: `url(${coverUrl})` }} />
              <div className="relative flex items-center gap-3">
                <img src={coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover shadow-lg shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" />Auto dal brano</p>
                  <p className="text-xs text-muted-foreground truncate">{trackName} · {artistName}</p>
                </div>
                {colorTheme === "dynamic" && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/40 via-accent/40 to-secondary/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold">Dynamic Theme</p>
                <p className="text-xs text-muted-foreground">Si adatta al brano corrente</p>
              </div>
              {colorTheme === "dynamic" && <Check className="w-4 h-4 text-primary shrink-0" />}
            </div>
          )}
        </motion.button>

        <AnimatePresence>
          {colorTheme === "dynamic" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Auto Light/Dark</p>
                  <p className="text-xs text-muted-foreground">Cambia tema in base alla copertina</p>
                </div>
                <button onClick={() => setAutoDarkMode(!autoDarkMode)}
                  className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${autoDarkMode ? "bg-primary" : "bg-muted"}`}>
                  <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: autoDarkMode ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2">
          {colorThemes.map(c => (
            <motion.button key={c.id} whileTap={{ scale: 0.95 }} onClick={() => setColorTheme(c.id as any)}
              className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${colorTheme === c.id ? "border-primary bg-primary/10" : "border-border hover:border-border/60"}`}>
              <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-xs font-medium truncate">{c.name}</span>
              {colorTheme === c.id && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
            </motion.button>
          ))}
        </div>
      </SectionBox>

      {/* Icona app */}
      <SectionBox icon={ImageIcon} title="Icona app">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border">
          {selectedIcon.src
            ? <img src={selectedIcon.src} alt="" className="w-14 h-14 rounded-2xl shadow-lg" />
            : <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
          }
          <div>
            <p className="font-semibold text-sm">{selectedIcon.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeAppIcon === "auto" ? "Si adatta al tema corrente" : "Icona manuale"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setActiveAppIcon("auto")}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${activeAppIcon === "auto" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/50 via-violet-500/40 to-pink-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-medium">Auto</span>
            {activeAppIcon === "auto" && <Check className="w-3 h-3 text-primary" />}
          </motion.button>
          {iconsList.slice(1).map(icon => (
            <motion.button key={icon.id} whileTap={{ scale: 0.92 }} onClick={() => setActiveAppIcon(icon.id)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${activeAppIcon === icon.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
              <img src={icon.src!} alt={icon.name} className="w-12 h-12 rounded-xl shadow-sm object-cover" />
              <span className="text-[10px] font-medium leading-none text-center line-clamp-2">{icon.name}</span>
              {activeAppIcon === icon.id && <Check className="w-3 h-3 text-primary" />}
            </motion.button>
          ))}
        </div>
      </SectionBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEZIONE AUDIO
// ─────────────────────────────────────────────────────────────────────────────
const AUDIO_STORAGE = "harmony_audio_settings_v2";

function loadAudio(): AudioConfig {
  try {
    const s = localStorage.getItem(AUDIO_STORAGE);
    if (s) return { ...defaultAudio(), ...JSON.parse(s) };
  } catch {}
  return defaultAudio();
}
function defaultAudio(): AudioConfig {
  return {
    streamingQuality: "high", downloadQuality: "high",
    crossfadeSec: 0, loudnessNorm: true, gaplessPlayback: true,
    monoAudio: false, hardwareAccel: true, autoplay: true,
  };
}

function TabAudio() {
  const [cfg, setCfg]   = useState<AudioConfig>(loadAudio);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const upd = (p: Partial<AudioConfig>) => setCfg(prev => ({ ...prev, ...p }));

  const save = () => {
    localStorage.setItem(AUDIO_STORAGE, JSON.stringify(cfg));
    setSaved(true);
    toast({ title: "✓ Impostazioni audio salvate" });
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    const d = defaultAudio();
    setCfg(d);
    localStorage.setItem(AUDIO_STORAGE, JSON.stringify(d));
    toast({ title: "Impostazioni ripristinate" });
  };

  const QualityRadio = ({ label, field }: { label: string; field: "streamingQuality"|"downloadQuality" }) => (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="space-y-1">
        {Object.entries(QUALITY_LABELS).map(([v, l]) => (
          <button key={v} onClick={() => upd({ [field]: v } as any)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${cfg[field] === v ? "bg-primary/15 text-primary" : "hover:bg-background/40 text-muted-foreground"}`}>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${cfg[field] === v ? "border-primary" : "border-muted-foreground/40"}`}>
              {cfg[field] === v && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            {l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Azioni header */}
      <div className="flex gap-2 justify-end">
        <button onClick={reset} className="p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={save}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${saved ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"}`}>
          <Save className="w-4 h-4" />{saved ? "Salvato!" : "Salva"}
        </motion.button>
      </div>

      <SectionBox icon={Wifi} title="Qualità streaming">
        <QualityRadio label="Quando in streaming" field="streamingQuality" />
      </SectionBox>

      <SectionBox icon={Download} title="Qualità download">
        <QualityRadio label="Quando si scarica offline" field="downloadQuality" />
      </SectionBox>

      <SectionBox icon={Zap} title="Crossfade">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Durata</span>
            <span className="font-semibold text-primary">{cfg.crossfadeSec === 0 ? "Disattivato" : `${cfg.crossfadeSec}s`}</span>
          </div>
          <input type="range" min={0} max={12} step={1} value={cfg.crossfadeSec}
            onChange={e => upd({ crossfadeSec: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(cfg.crossfadeSec/12)*100}%, hsl(var(--secondary)) ${(cfg.crossfadeSec/12)*100}%)` }}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50">
            <span>Off</span>{[3,6,9].map(v=><span key={v}>{v}s</span>)}<span>12s</span>
          </div>
        </div>
      </SectionBox>

      <SectionBox icon={Music2} title="Riproduzione">
        <Toggle label="Normalizzazione volume" desc="Mantiene il volume omogeneo tra i brani" value={cfg.loudnessNorm} onChange={v=>upd({loudnessNorm:v})} />
        <Toggle label="Riproduzione senza spazi" desc="Elimina i silenzi tra i brani" value={cfg.gaplessPlayback} onChange={v=>upd({gaplessPlayback:v})} />
        <Toggle label="Autoplay" desc="Suggerisce brani simili a fine coda" value={cfg.autoplay} onChange={v=>upd({autoplay:v})} />
      </SectionBox>

      <SectionBox icon={Volume2} title="Audio">
        <Toggle label="Audio mono" desc="Combina canali stereo in uno" value={cfg.monoAudio} onChange={v=>upd({monoAudio:v})} />
        <Toggle label="Accelerazione hardware" desc="Usa la GPU per le prestazioni audio" value={cfg.hardwareAccel} onChange={v=>upd({hardwareAccel:v})} />
      </SectionBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEZIONE CUFFIE
// ─────────────────────────────────────────────────────────────────────────────
function TabCuffie() {
  const [selectedBrandIdx, setSelectedBrandIdx]   = useState<number | null>(null);
  const [selectedModelId,  setSelectedModelId]    = useState<string | null>(null);
  const [ancMode,          setAncMode]            = useState<AncMode>("off");
  const [eqPreset,         setEqPreset]           = useState("Normal");
  const [eqGains,          setEqGains]            = useState([0,0,0,0,0]);
  const [spatial,          setSpatial]            = useState(false);
  const [showBrandDrop,    setShowBrandDrop]       = useState(false);
  const [showModelDrop,    setShowModelDrop]       = useState(false);
  const { toast } = useToast();

  const brand = selectedBrandIdx !== null ? HEADPHONE_BRANDS[selectedBrandIdx] : null;
  const model = brand?.models.find(m => m.id === selectedModelId) ?? null;

  const apply = (key: string, val: string) =>
    toast({ title: `⚙ ${key}`, description: `${val}${brand?.appName ? ` — Usa ${brand.appName} per applicare` : ""}` });

  const openApp = () => {
    if (!brand) return;
    if (IS_ANDROID && brand.appAndroid) {
      window.location.href = brand.appAndroid;
      if (brand.appFallback) setTimeout(() => { window.location.href = brand.appFallback; }, 1500);
    } else if (IS_IOS && brand.appIos) {
      window.location.href = brand.appIos;
    } else {
      toast({ title: "App non disponibile", description: "Usa l'app del produttore su mobile", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">

      {/* Info web */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Le cuffie si controllano via Bluetooth. Su browser il controllo diretto non è disponibile — le impostazioni si salvano qui e si applicano dall'app del produttore.
        </p>
      </div>

      {/* Selezione brand */}
      <div>
        <button onClick={() => { setShowBrandDrop(v=>!v); setShowModelDrop(false); }}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors">
          <div className="flex items-center gap-3">
            <Bluetooth className={`w-5 h-5 ${brand?.color ?? "text-muted-foreground"}`} />
            <div className="text-left">
              <p className="font-semibold text-sm">{brand?.brand ?? "Seleziona marca"}</p>
              <p className="text-xs text-muted-foreground">{brand ? "Marca selezionata" : "Scegli il produttore"}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showBrandDrop ? "rotate-180":""}`} />
        </button>

        <AnimatePresence>
          {showBrandDrop && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="overflow-hidden pt-1">
              <div className="space-y-1 p-2 rounded-xl bg-card border border-border">
                {HEADPHONE_BRANDS.map((b, idx) => (
                  <button key={b.brand} onClick={() => { setSelectedBrandIdx(idx); setSelectedModelId(null); setShowBrandDrop(false); setShowModelDrop(true); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedBrandIdx===idx ? "bg-primary/15 text-primary" : "hover:bg-secondary/50"}`}>
                    <div className={`w-8 h-8 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}>
                      <Headphones className={`w-4 h-4 ${b.color}`} />
                    </div>
                    <span className="font-medium">{b.brand}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{b.models.length} modelli</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selezione modello */}
      {brand && (
        <div>
          <button onClick={() => setShowModelDrop(v=>!v)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl ${brand.bg} flex items-center justify-center shrink-0`}>
                <Headphones className={`w-4 h-4 ${brand.color}`} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{model?.name ?? "Seleziona modello"}</p>
                <p className="text-xs text-muted-foreground">{model ? brand.brand : "Scegli il modello"}</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showModelDrop?"rotate-180":""}`} />
          </button>

          <AnimatePresence>
            {showModelDrop && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                className="overflow-hidden pt-1">
                <div className="space-y-1 p-2 rounded-xl bg-card border border-border">
                  {brand.models.map(m => (
                    <button key={m.id} onClick={() => { setSelectedModelId(m.id); setShowModelDrop(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedModelId===m.id ? "bg-primary/15 text-primary":"hover:bg-secondary/50"}`}>
                      <span className="font-medium">{m.name}</span>
                      <div className="flex items-center gap-1">
                        {m.anc && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">ANC</span>}
                        {m.eq  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-semibold">EQ</span>}
                        {m.spatial && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">360°</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Controlli modello selezionato */}
      {model && (
        <div className="space-y-3">

          {/* Badge funzionalità */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label:"ANC",    ok:model.anc,     icon:Wind },
              { label:"EQ",     ok:model.eq,      icon:Music2 },
              { label:"360°",   ok:model.spatial, icon:Zap },
            ].map(({ label, ok, icon: Icon }) => (
              <div key={label} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium ${ok ? "bg-green-500/10 text-green-400 border border-green-500/20":"bg-secondary/30 text-muted-foreground/40 border border-border/20"}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
                {ok ? <CheckCircle2 className="w-3 h-3 ml-auto" /> : <span className="ml-auto text-[9px]">N/D</span>}
              </div>
            ))}
          </div>

          {/* ANC */}
          {model.anc && (
            <SectionBox icon={Wind} title="Riduzione rumore">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id:"off",     label:"Spento" },
                  { id:"anc",     label:"ANC" },
                  { id:"ambient", label:"Ambiente" },
                ] as const).map(opt => (
                  <button key={opt.id}
                    onClick={() => { setAncMode(opt.id); apply("ANC", opt.label); }}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${ancMode===opt.id ? "bg-primary text-primary-foreground":"bg-background/40 text-muted-foreground hover:text-foreground"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </SectionBox>
          )}

          {/* EQ */}
          {model.eq && (
            <SectionBox icon={Music2} title="Equalizzatore">
              <div className="grid grid-cols-3 gap-2">
                {EQ_PRESETS.map(p => (
                  <button key={p.name}
                    onClick={() => { setEqPreset(p.name); setEqGains(p.gains); apply("EQ", p.name); }}
                    className={`py-2 rounded-xl text-xs font-medium transition-colors ${eqPreset===p.name ? "bg-primary text-primary-foreground":"bg-background/40 text-muted-foreground hover:text-foreground"}`}>
                    {p.name}
                  </button>
                ))}
              </div>
              {/* Visualizzazione bande */}
              <div className="flex items-end justify-center gap-1 h-10 px-2 mt-1">
                {["60Hz","250Hz","1kHz","4kHz","12kHz"].map((band, i) => (
                  <div key={band} className="flex flex-col items-center gap-0.5 flex-1">
                    <div className="flex-1 w-full flex flex-col justify-end items-center">
                      <div className="w-full rounded-t transition-all"
                        style={{
                          height:`${Math.max(8,((eqGains[i]+4)/8)*100)}%`,
                          background:`hsl(${200+i*28},75%,55%)`,
                          opacity:0.8,
                        }} />
                    </div>
                    <span className="text-[8px] text-muted-foreground/50">{band}</span>
                  </div>
                ))}
              </div>
            </SectionBox>
          )}

          {/* Audio spaziale */}
          {model.spatial && (
            <div className="p-4 rounded-2xl bg-secondary/40 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Audio spaziale 360°</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tracciamento testa e suono surround</p>
              </div>
              <button onClick={() => { setSpatial(v=>!v); apply("Audio spaziale", !spatial?"ON":"OFF"); }}
                className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${spatial?"bg-primary":"bg-secondary"}`}>
                <motion.div className="w-5 h-5 rounded-full bg-white shadow"
                  animate={{ x: spatial?24:0 }} transition={{ type:"spring", stiffness:400, damping:25 }} />
              </button>
            </div>
          )}

          {/* Apri app produttore */}
          {brand?.appName && (
            <button onClick={openApp}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-sm text-primary">Apri {brand.appName}</p>
                  <p className="text-xs text-muted-foreground">Applica le impostazioni sull'app</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "aspetto", label: "Aspetto",  icon: Palette    },
  { id: "audio",   label: "Audio",    icon: Volume2    },
  { id: "cuffie",  label: "Cuffie",   icon: Headphones },
];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("aspetto");
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-xl font-bold">Impostazioni</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {active && (
                      <motion.div layoutId="tab-indicator" className="w-1 h-1 rounded-full bg-primary" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Contenuto tab */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === "aspetto" && <TabAspetto />}
                  {activeTab === "audio"   && <TabAudio />}
                  {activeTab === "cuffie"  && <TabCuffie />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border shrink-0 space-y-2">
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive font-semibold text-sm transition-colors">
                <LogOut className="w-4 h-4" /> Logout da Spotify
              </button>
              <p className="text-xs text-muted-foreground text-center">Modifiche salvate automaticamente</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
