import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sun,
  Moon,
  Palette,
  Sparkles,
  LogOut,
  ImageIcon,
  Check,
  Headphones,
  Volume2,
  Settings2,
  Wifi,
  Download,
  Zap,
  Music2,
  Wind,
  Bluetooth,
  ChevronDown,
  Info,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Save,
  Monitor,
  ArrowLeft,
  Github,
  Clock3,
  Shield,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { useTheme } from "@/contexts/ThemeContext";
import { clearToken } from "@/services/spotify-auth";
import { useNavigate } from "react-router-dom";
import { usePlaybackState, useUserProfile } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
// ─────────────────────────────────────────────────────────────────────────────
// DATI STATICI
// ─────────────────────────────────────────────────────────────────────────────

const colorThemes = [
  { id: "blue", name: "Ocean Blue", color: "hsl(217,91%,60%)" },
  { id: "purple", name: "Royal Purple", color: "hsl(271,91%,65%)" },
  { id: "violet", name: "Deep Violet", color: "hsl(250,85%,70%)" },
  { id: "emerald", name: "Emerald", color: "hsl(158,86%,55%)" },
  { id: "teal", name: "Teal Wave", color: "hsl(178,90%,55%)" },
  { id: "amber", name: "Golden Amber", color: "hsl(43,96%,60%)" },
  { id: "rose", name: "Rose Garden", color: "hsl(355,91%,65%)" },
  { id: "crimson", name: "Crimson Red", color: "hsl(0,91%,71%)" },
  { id: "indigo", name: "Indigo Night", color: "hsl(239,90%,70%)" },
  { id: "lime", name: "Electric Lime", color: "hsl(85,90%,55%)" },
  { id: "sky", name: "Sky Blue", color: "hsl(200,98%,60%)" },
  { id: "fuchsia", name: "Fuchsia Pink", color: "hsl(300,91%,73%)" },
] as const;

const iconsList = [
  { id: "auto", name: "Auto", src: null },
  {
    id: "app_blu_scuro.png",
    name: "Blu Scuro",
    src: "/icons/app_blu_scuro.png",
  },
  {
    id: "app_blu_chiaro.png",
    name: "Blu Chiaro",
    src: "/icons/app_blu_chiaro.png",
  },
  {
    id: "app_viola_scuro.png",
    name: "Viola Scuro",
    src: "/icons/app_viola_scuro.png",
  },
  {
    id: "app_viola_chiaro.png",
    name: "Viola Chiaro",
    src: "/icons/app_viola_chiaro.png",
  },
  {
    id: "app_azzurro_scuro.png",
    name: "Azzurro Scuro",
    src: "/icons/app_azzurro_scuro.png",
  },
  {
    id: "app_azzurro_chiaro.png",
    name: "Azzurro Chiaro",
    src: "/icons/app_azzurro_chiaro.png",
  },
  {
    id: "app_verde_scuro.png",
    name: "Verde Scuro",
    src: "/icons/app_verde_scuro.png",
  },
  {
    id: "app_verde_chiaro.png",
    name: "Verde Chiaro",
    src: "/icons/app_verde_chiaro.png",
  },
  {
    id: "app_arancione_scuro.png",
    name: "Arancione Scuro",
    src: "/icons/app_arancione_scuro.png",
  },
  {
    id: "app_arancione_chiaro.png",
    name: "Arancione Chiaro",
    src: "/icons/app_arancione_chiaro.png",
  },
  {
    id: "app_rosa_scuro.png",
    name: "Rosa Scuro",
    src: "/icons/app_rosa_scuro.png",
  },
  {
    id: "app_rosa_chiaro.png",
    name: "Rosa Chiaro",
    src: "/icons/app_rosa_chiaro.png",
  },
  {
    id: "app_rosso_scuro.png",
    name: "Rosso Scuro",
    src: "/icons/app_rosso_scuro.png",
  },
  {
    id: "app_rosso_chiaro.png",
    name: "Rosso Chiaro",
    src: "/icons/app_rosso_chiaro.png",
  },
];

// Tipi di cuffie supportati
const HEADPHONE_BRANDS = [
  {
    brand: "Samsung",
    models: [
      {
        id: "buds3pro",
        name: "Galaxy Buds3 Pro",
        anc: true,
        eq: true,
        spatial: true,
        app: "galaxywearable://",
      },
      {
        id: "buds3",
        name: "Galaxy Buds3",
        anc: true,
        eq: true,
        spatial: false,
        app: "galaxywearable://",
      },
      {
        id: "buds2pro",
        name: "Galaxy Buds2 Pro",
        anc: true,
        eq: true,
        spatial: true,
        app: "galaxywearable://",
      },
      {
        id: "buds2",
        name: "Galaxy Buds2",
        anc: true,
        eq: true,
        spatial: false,
        app: "galaxywearable://",
      },
      {
        id: "budsLive",
        name: "Galaxy Buds Live",
        anc: true,
        eq: true,
        spatial: false,
        app: "galaxywearable://",
      },
      {
        id: "budsPro",
        name: "Galaxy Buds Pro",
        anc: true,
        eq: true,
        spatial: false,
        app: "galaxywearable://",
      },
      {
        id: "budsPlus",
        name: "Galaxy Buds+",
        anc: false,
        eq: false,
        spatial: false,
        app: "galaxywearable://",
      },
    ],
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    appName: "Galaxy Wearable",
    appAndroid: "galaxywearable://",
    appIos:
      "https://apps.apple.com/it/app/galaxy-wearable-watch-manager/id1113456516",
    appFallback:
      "https://play.google.com/store/apps/details?id=com.samsung.accessory",
  },
  {
    brand: "Apple",
    models: [
      {
        id: "airpods4anc",
        name: "AirPods 4 (ANC)",
        anc: true,
        eq: false,
        spatial: true,
        app: "",
      },
      {
        id: "airpods4",
        name: "AirPods 4",
        anc: false,
        eq: false,
        spatial: true,
        app: "",
      },
      {
        id: "airpodspro2",
        name: "AirPods Pro 2",
        anc: true,
        eq: false,
        spatial: true,
        app: "",
      },
      {
        id: "airpodspro",
        name: "AirPods Pro",
        anc: true,
        eq: false,
        spatial: true,
        app: "",
      },
      {
        id: "airpods3",
        name: "AirPods 3",
        anc: false,
        eq: false,
        spatial: true,
        app: "",
      },
      {
        id: "airpodsmax",
        name: "AirPods Max",
        anc: true,
        eq: false,
        spatial: true,
        app: "",
      },
      {
        id: "airpods2",
        name: "AirPods 2",
        anc: false,
        eq: false,
        spatial: false,
        app: "",
      },
    ],
    color: "text-slate-300",
    bg: "bg-slate-300/10",
    appName: "Impostazioni iOS",
    appAndroid: "",
    appIos: "App-prefs:Bluetooth",
    appFallback: "",
  },
  {
    brand: "Sony",
    models: [
      {
        id: "xm6",
        name: "WH-1000XM6",
        anc: true,
        eq: true,
        spatial: true,
        app: "sonymusicconnect://",
      },
      {
        id: "xm5",
        name: "WH-1000XM5",
        anc: true,
        eq: true,
        spatial: false,
        app: "sonymusicconnect://",
      },
      {
        id: "xm4",
        name: "WH-1000XM4",
        anc: true,
        eq: true,
        spatial: false,
        app: "sonymusicconnect://",
      },
      {
        id: "wf1000xm5",
        name: "WF-1000XM5",
        anc: true,
        eq: true,
        spatial: true,
        app: "sonymusicconnect://",
      },
      {
        id: "wf1000xm4",
        name: "WF-1000XM4",
        anc: true,
        eq: true,
        spatial: false,
        app: "sonymusicconnect://",
      },
    ],
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    appName: "Sony | Headphones Connect",
    appAndroid: "sonymusicconnect://",
    appIos: "sonymusicconnect://",
    appFallback:
      "https://play.google.com/store/apps/details?id=com.sony.songpal.headphone",
  },
  {
    brand: "Bose",
    models: [
      {
        id: "qc45",
        name: "QuietComfort 45",
        anc: true,
        eq: true,
        spatial: false,
        app: "bosemusic://",
      },
      {
        id: "qcUE",
        name: "QuietComfort Ultra Earbuds",
        anc: true,
        eq: true,
        spatial: true,
        app: "bosemusic://",
      },
      {
        id: "qcUH",
        name: "QuietComfort Ultra Headphones",
        anc: true,
        eq: true,
        spatial: true,
        app: "bosemusic://",
      },
      {
        id: "700",
        name: "Bose 700",
        anc: true,
        eq: true,
        spatial: false,
        app: "bosemusic://",
      },
    ],
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    appName: "Bose Music",
    appAndroid: "bosemusic://",
    appIos: "bosemusic://",
    appFallback:
      "https://play.google.com/store/apps/details?id=com.bose.bosemusic",
  },
  {
    brand: "Jabra",
    models: [
      {
        id: "elite10",
        name: "Jabra Elite 10",
        anc: true,
        eq: true,
        spatial: true,
        app: "jabrasound://",
      },
      {
        id: "elite8",
        name: "Jabra Elite 8",
        anc: true,
        eq: true,
        spatial: false,
        app: "jabrasound://",
      },
      {
        id: "evolve265",
        name: "Jabra Evolve2 65",
        anc: true,
        eq: true,
        spatial: false,
        app: "jabrasound://",
      },
    ],
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    appName: "Jabra Sound+",
    appAndroid: "jabrasound://",
    appIos: "jabrasound://",
    appFallback:
      "https://play.google.com/store/apps/details?id=com.jabra.ndw.android",
  },
  {
    brand: "Altro / Generico",
    models: [
      {
        id: "generic",
        name: "Cuffie generiche",
        anc: false,
        eq: true,
        spatial: false,
        app: "",
      },
    ],
    color: "text-muted-foreground",
    bg: "bg-muted/20",
    appName: "",
    appAndroid: "",
    appIos: "",
    appFallback: "",
  },
];

const EQ_PRESETS = [
  { name: "Normal", gains: [0, 0, 0, 0, 0] },
  { name: "Bass Boost", gains: [3, 2, 0, 0, 0] },
  { name: "Soft", gains: [-1, -1, 0, 1, 1] },
  { name: "Dynamic", gains: [1, 0, 0, 0, 1] },
  { name: "Clear", gains: [0, 0, 0, 2, 3] },
  { name: "Treble Boost", gains: [0, 0, 0, 2, 4] },
];

const QUALITY_LABELS: Record<string, string> = {
  low: "Bassa (~96 kbps)",
  normal: "Normale (~160 kbps)",
  high: "Alta (~320 kbps)",
  very_high: "Molto alta (Lossless)",
};

const IS_ANDROID = /Android/i.test(navigator.userAgent);
const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const IS_MOBILE = IS_ANDROID || IS_IOS;

// ─────────────────────────────────────────────────────────────────────────────
// TIPI
// ─────────────────────────────────────────────────────────────────────────────
type Tab = "aspetto" | "audio" | "cuffie" | "account";
type AncMode = "off" | "anc" | "ambient";

interface AudioConfig {
  streamingQuality: "low" | "normal" | "high" | "very_high";
  downloadQuality: "low" | "normal" | "high" | "very_high";
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
function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${value ? "bg-primary" : "bg-secondary"}`}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: value ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function SectionBox({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<any>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
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
    theme,
    colorTheme,
    setTheme,
    setColorTheme,
    autoDarkMode,
    setAutoDarkMode,
    activeAppIcon,
    setActiveAppIcon,
  } = useTheme();
  const { data: playbackState } = usePlaybackState();
  const coverUrl = playbackState?.item?.album?.images?.[0]?.url;
  const trackName = playbackState?.item?.name;
  const artistName = playbackState?.item?.artists?.[0]?.name;
  const selectedIcon =
    iconsList.find((i) => i.id === activeAppIcon) ?? iconsList[0];

  return (
    <div className="space-y-6">
      {/* Tema */}
      <SectionBox icon={Sun} title="Tema">
        <div className="grid grid-cols-3 gap-3">
          {(["light", "dark", "system"] as const).map((t) => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTheme(t)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
            >
              {t === "light" ? (
                <Sun className="w-5 h-5" />
              ) : t === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">
                {t === "light" ? "Chiaro" : t === "dark" ? "Scuro" : "Sistema"}
              </span>
            </motion.button>
          ))}
        </div>
      </SectionBox>

      {/* Colore */}
      <SectionBox icon={Palette} title="Colore accento">
        {/* Dynamic */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setColorTheme("dynamic")}
          className={`w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden ${colorTheme === "dynamic" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
        >
          {coverUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30"
                style={{ backgroundImage: `url(${coverUrl})` }}
              />
              <div className="relative flex items-center gap-3">
                <img
                  src={coverUrl}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shadow-lg shrink-0"
                />
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Auto dal brano
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {trackName} · {artistName}
                  </p>
                </div>
                {colorTheme === "dynamic" && (
                  <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/40 via-accent/40 to-secondary/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold">Dynamic Theme</p>
                <p className="text-xs text-muted-foreground">
                  Si adatta al brano corrente
                </p>
              </div>
              {colorTheme === "dynamic" && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
          )}
        </motion.button>

        <AnimatePresence>
          {colorTheme === "dynamic" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Auto Light/Dark</p>
                  <p className="text-xs text-muted-foreground">
                    Cambia tema in base alla copertina
                  </p>
                </div>
                <button
                  onClick={() => setAutoDarkMode(!autoDarkMode)}
                  className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${autoDarkMode ? "bg-primary" : "bg-muted"}`}
                >
                  <motion.div
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                    animate={{ x: autoDarkMode ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2">
          {colorThemes.map((c) => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setColorTheme(c.id as any)}
              className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${colorTheme === c.id ? "border-primary bg-primary/10" : "border-border hover:border-border/60"}`}
            >
              <div
                className="w-6 h-6 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-xs font-medium truncate">{c.name}</span>
              {colorTheme === c.id && (
                <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
              )}
            </motion.button>
          ))}
        </div>
      </SectionBox>

      {/* Icona app */}
      <SectionBox icon={ImageIcon} title="Icona app">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border">
          {selectedIcon.src ? (
            <img
              src={selectedIcon.src}
              alt=""
              className="w-14 h-14 rounded-2xl shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">{selectedIcon.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeAppIcon === "auto"
                ? "Si adatta al tema corrente"
                : "Icona manuale"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveAppIcon("auto")}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${activeAppIcon === "auto" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/50 via-violet-500/40 to-pink-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-medium">Auto</span>
            {activeAppIcon === "auto" && (
              <Check className="w-3 h-3 text-primary" />
            )}
          </motion.button>
          {iconsList.slice(1).map((icon) => (
            <motion.button
              key={icon.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveAppIcon(icon.id)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${activeAppIcon === icon.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
            >
              <img
                src={icon.src!}
                alt={icon.name}
                className="w-12 h-12 rounded-xl shadow-sm object-cover"
              />
              <span className="text-[10px] font-medium leading-none text-center line-clamp-2">
                {icon.name}
              </span>
              {activeAppIcon === icon.id && (
                <Check className="w-3 h-3 text-primary" />
              )}
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
    streamingQuality: "high",
    downloadQuality: "high",
    crossfadeSec: 0,
    loudnessNorm: true,
    gaplessPlayback: true,
    monoAudio: false,
    hardwareAccel: true,
    autoplay: true,
  };
}

function TabAudio() {
  const [cfg, setCfg] = useState<AudioConfig>(loadAudio);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const upd = (p: Partial<AudioConfig>) =>
    setCfg((prev) => ({ ...prev, ...p }));

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

  const QualityRadio = ({
    label,
    field,
  }: {
    label: string;
    field: "streamingQuality" | "downloadQuality";
  }) => (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="space-y-1">
        {Object.entries(QUALITY_LABELS).map(([v, l]) => (
          <button
            key={v}
            onClick={() => upd({ [field]: v } as any)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${cfg[field] === v ? "bg-primary/15 text-primary" : "hover:bg-background/40 text-muted-foreground"}`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${cfg[field] === v ? "border-primary" : "border-muted-foreground/40"}`}
            >
              {cfg[field] === v && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
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
        <button
          onClick={reset}
          className="p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={save}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${saved ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"}`}
        >
          <Save className="w-4 h-4" />
          {saved ? "Salvato!" : "Salva"}
        </motion.button>
      </div>

      <SectionBox icon={Wifi} title="Qualità streaming">
        <QualityRadio label="Quando in streaming" field="streamingQuality" />
      </SectionBox>

      <SectionBox icon={Download} title="Qualità download">
        <QualityRadio
          label="Quando si scarica offline"
          field="downloadQuality"
        />
      </SectionBox>

      <SectionBox icon={Zap} title="Crossfade">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Durata</span>
            <span className="font-semibold text-primary">
              {cfg.crossfadeSec === 0 ? "Disattivato" : `${cfg.crossfadeSec}s`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={cfg.crossfadeSec}
            onChange={(e) => upd({ crossfadeSec: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${(cfg.crossfadeSec / 12) * 100}%, hsl(var(--secondary)) ${(cfg.crossfadeSec / 12) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50">
            <span>Off</span>
            {[3, 6, 9].map((v) => (
              <span key={v}>{v}s</span>
            ))}
            <span>12s</span>
          </div>
        </div>
      </SectionBox>

      <SectionBox icon={Music2} title="Riproduzione">
        <Toggle
          label="Normalizzazione volume"
          desc="Mantiene il volume omogeneo tra i brani"
          value={cfg.loudnessNorm}
          onChange={(v) => upd({ loudnessNorm: v })}
        />
        <Toggle
          label="Riproduzione senza spazi"
          desc="Elimina i silenzi tra i brani"
          value={cfg.gaplessPlayback}
          onChange={(v) => upd({ gaplessPlayback: v })}
        />
        <Toggle
          label="Autoplay"
          desc="Suggerisce brani simili a fine coda"
          value={cfg.autoplay}
          onChange={(v) => upd({ autoplay: v })}
        />
      </SectionBox>

      <SectionBox icon={Volume2} title="Audio">
        <Toggle
          label="Audio mono"
          desc="Combina canali stereo in uno"
          value={cfg.monoAudio}
          onChange={(v) => upd({ monoAudio: v })}
        />
        <Toggle
          label="Accelerazione hardware"
          desc="Usa la GPU per le prestazioni audio"
          value={cfg.hardwareAccel}
          onChange={(v) => upd({ hardwareAccel: v })}
        />
      </SectionBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEZIONE CUFFIE
// ─────────────────────────────────────────────────────────────────────────────
function TabCuffie() {
  const [selectedBrandIdx, setSelectedBrandIdx] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [ancMode, setAncMode] = useState<AncMode>("off");
  const [eqPreset, setEqPreset] = useState("Normal");
  const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0]);
  const [spatial, setSpatial] = useState(false);
  const [showBrandDrop, setShowBrandDrop] = useState(false);
  const [showModelDrop, setShowModelDrop] = useState(false);
  const { toast } = useToast();

  const brand =
    selectedBrandIdx !== null ? HEADPHONE_BRANDS[selectedBrandIdx] : null;
  const model = brand?.models.find((m) => m.id === selectedModelId) ?? null;

  const apply = (key: string, val: string) =>
    toast({
      title: `⚙ ${key}`,
      description: `${val}${brand?.appName ? ` — Usa ${brand.appName} per applicare` : ""}`,
    });

  const openApp = () => {
    if (!brand) return;
    if (IS_ANDROID && brand.appAndroid) {
      window.location.href = brand.appAndroid;
      if (brand.appFallback)
        setTimeout(() => {
          window.location.href = brand.appFallback;
        }, 1500);
    } else if (IS_IOS && brand.appIos) {
      window.location.href = brand.appIos;
    } else {
      toast({
        title: "App non disponibile",
        description: "Usa l'app del produttore su mobile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Info web */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Le cuffie si controllano via Bluetooth. Su browser il controllo
          diretto non è disponibile — le impostazioni si salvano qui e si
          applicano dall'app del produttore.
        </p>
      </div>

      {/* Selezione brand */}
      <div>
        <button
          onClick={() => {
            setShowBrandDrop((v) => !v);
            setShowModelDrop(false);
          }}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bluetooth
              className={`w-5 h-5 ${brand?.color ?? "text-muted-foreground"}`}
            />
            <div className="text-left">
              <p className="font-semibold text-sm">
                {brand?.brand ?? "Seleziona marca"}
              </p>
              <p className="text-xs text-muted-foreground">
                {brand ? "Marca selezionata" : "Scegli il produttore"}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${showBrandDrop ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showBrandDrop && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-1"
            >
              <div className="space-y-1 p-2 rounded-xl bg-card border border-border">
                {HEADPHONE_BRANDS.map((b, idx) => (
                  <button
                    key={b.brand}
                    onClick={() => {
                      setSelectedBrandIdx(idx);
                      setSelectedModelId(null);
                      setShowBrandDrop(false);
                      setShowModelDrop(true);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedBrandIdx === idx ? "bg-primary/15 text-primary" : "hover:bg-secondary/50"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}
                    >
                      <Headphones className={`w-4 h-4 ${b.color}`} />
                    </div>
                    <span className="font-medium">{b.brand}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {b.models.length} modelli
                    </span>
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
          <button
            onClick={() => setShowModelDrop((v) => !v)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl ${brand.bg} flex items-center justify-center shrink-0`}
              >
                <Headphones className={`w-4 h-4 ${brand.color}`} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">
                  {model?.name ?? "Seleziona modello"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {model ? brand.brand : "Scegli il modello"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${showModelDrop ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showModelDrop && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-1"
              >
                <div className="space-y-1 p-2 rounded-xl bg-card border border-border">
                  {brand.models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModelId(m.id);
                        setShowModelDrop(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedModelId === m.id ? "bg-primary/15 text-primary" : "hover:bg-secondary/50"}`}
                    >
                      <span className="font-medium">{m.name}</span>
                      <div className="flex items-center gap-1">
                        {m.anc && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                            ANC
                          </span>
                        )}
                        {m.eq && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-semibold">
                            EQ
                          </span>
                        )}
                        {m.spatial && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                            360°
                          </span>
                        )}
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
              { label: "ANC", ok: model.anc, icon: Wind },
              { label: "EQ", ok: model.eq, icon: Music2 },
              { label: "360°", ok: model.spatial, icon: Zap },
            ].map(({ label, ok, icon: Icon }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium ${ok ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-secondary/30 text-muted-foreground/40 border border-border/20"}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
                {ok ? (
                  <CheckCircle2 className="w-3 h-3 ml-auto" />
                ) : (
                  <span className="ml-auto text-[9px]">N/D</span>
                )}
              </div>
            ))}
          </div>

          {/* ANC */}
          {model.anc && (
            <SectionBox icon={Wind} title="Riduzione rumore">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "off", label: "Spento" },
                    { id: "anc", label: "ANC" },
                    { id: "ambient", label: "Ambiente" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setAncMode(opt.id);
                      apply("ANC", opt.label);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${ancMode === opt.id ? "bg-primary text-primary-foreground" : "bg-background/40 text-muted-foreground hover:text-foreground"}`}
                  >
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
                {EQ_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setEqPreset(p.name);
                      setEqGains(p.gains);
                      apply("EQ", p.name);
                    }}
                    className={`py-2 rounded-xl text-xs font-medium transition-colors ${eqPreset === p.name ? "bg-primary text-primary-foreground" : "bg-background/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {/* Visualizzazione bande */}
              <div className="flex items-end justify-center gap-1 h-10 px-2 mt-1">
                {["60Hz", "250Hz", "1kHz", "4kHz", "12kHz"].map((band, i) => (
                  <div
                    key={band}
                    className="flex flex-col items-center gap-0.5 flex-1"
                  >
                    <div className="flex-1 w-full flex flex-col justify-end items-center">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max(8, ((eqGains[i] + 4) / 8) * 100)}%`,
                          background: `hsl(${200 + i * 28},75%,55%)`,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground/50">
                      {band}
                    </span>
                  </div>
                ))}
              </div>
            </SectionBox>
          )}

          {/* Audio spaziale */}
          {model.spatial && (
            <div className="p-4 rounded-2xl bg-secondary/40 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Audio spaziale 360°
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tracciamento testa e suono surround
                </p>
              </div>
              <button
                onClick={() => {
                  setSpatial((v) => !v);
                  apply("Audio spaziale", !spatial ? "ON" : "OFF");
                }}
                className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${spatial ? "bg-primary" : "bg-secondary"}`}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow"
                  animate={{ x: spatial ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              </button>
            </div>
          )}

          {/* Apri app produttore */}
          {brand?.appName && (
            <button
              onClick={openApp}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-sm text-primary">
                    Apri {brand.appName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Applica le impostazioni sull'app
                  </p>
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

import {
  getCollabUsers,
  saveCollabUsers,
  getAdminFeedbacks,
  saveAdminFeedbacks,
  isSupabaseConfigured,
  getGlobalSettings,
} from "@/services/supabase-api";
import { saveTelegramChatId, removeTelegramChatId } from "@/services/telegram-api";
import { MessageSquare, Bug, Lightbulb, Star } from "lucide-react";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const Dot = ({ active, color = "#10b981" }: { active: boolean; color?: string }) => (
  <span
    className="inline-block w-1.5 h-1.5 rounded-full transition-all duration-300"
    style={{
      backgroundColor: active ? color : "rgba(255, 255, 255, 0.15)",
      boxShadow: active ? `0 0 5px ${color}` : "none",
    }}
  />
);

function TabAccount({ handleLogout }: { handleLogout: () => void }) {
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();
  const { data: playbackState } = usePlaybackState();
  const [showCollabPage, setShowCollabPage] = useState(false);
  const [showCollabDetails, setShowCollabDetails] = useState(false);
  const [showFeedbackPage, setShowFeedbackPage] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Migliorie");
  const [feedbackText, setFeedbackText] = useState("");
  const [collabUser, setCollabUser] = useState<any>(null);
  const [showCollabPassword, setShowCollabPassword] = useState(false);
  const [tempChatId, setTempChatId] = useState("");
  const [isSuper, setIsSuper] = useState(false);

  const handleSaveChatId = async () => {
    if (!tempChatId.trim() || !collabUser) return;
    const ok = await saveTelegramChatId(collabUser.id, tempChatId.trim());
    if (ok) {
      toast({
        title: "✓ Telegram Collegato",
        description: "Ora riceverai le notifiche su Telegram.",
      });
      setCollabUser({
        ...collabUser,
        telegramChatId: tempChatId.trim(),
        telegramEnabled: true,
      });
      setTempChatId("");
    } else {
      toast({
        title: "Errore",
        description: "Impossibile collegare Telegram.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveChatId = async () => {
    if (!collabUser) return;
    const ok = await removeTelegramChatId(collabUser.id);
    if (ok) {
      toast({
        title: "✓ Telegram Scollegato",
        description: "Account rimosso correttamente.",
      });
      setCollabUser({
        ...collabUser,
        telegramChatId: undefined,
      });
    } else {
      toast({
        title: "Errore",
        description: "Impossibile scollegare Telegram.",
        variant: "destructive",
      });
    }
  };

  const userName = userProfile?.display_name || "Utente Spotify";

  useEffect(() => {
    const checkSuper = async () => {
      const hash = await sha256hex(userName.trim());
      const raw = import.meta.env.VITE_ADMIN_CREDENTIALS ?? "";
      if (raw) {
        const pairs = raw.split(",").map((pair: string) => pair.split(":")[0]?.trim());
        if (pairs.includes(hash)) {
          setIsSuper(true);
        }
      }
    };
    checkSuper();
  }, [userName]);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const users = await getCollabUsers();
      if (!mounted) return;
      const me = users.find((u: any) => u.name.toLowerCase() === userName.toLowerCase() && u.id !== "system_settings");
      setCollabUser(me || null);
    };

    fetchUser();
    const interval = setInterval(fetchUser, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userName]);

  const sendCollabRequest = async () => {
    try {
      // Check session requests count limit
      const globalSettings = await getGlobalSettings();
      const maxRequests = globalSettings?.maxRequestsPerSession ?? 2;
      const sessionCount = parseInt(sessionStorage.getItem("collab_requests_sent") || "0", 10);
      
      if (sessionCount >= maxRequests) {
        toast({
          title: "Limite Raggiunto",
          description: `Hai già inviato il limite massimo di ${maxRequests} richieste per questa sessione.`,
          variant: "destructive",
        });
        return;
      }

      const existingUsers = await getCollabUsers();
      let me = existingUsers.find((u: any) => u.name === userName);

      if (!me) {
        me = {
          id: Date.now().toString(),
          name: userName,
          requestedAt: new Date().toISOString(),
          status: "pending",
          permissions: {
            canViewStats: false,
            canViewToken: false,
            canAccessAdmin: false,
            canAccessGithub: false,
          },
          message: "Richiesta inviata dal pannello impostazioni",
        };
        existingUsers.push(me);
        await saveCollabUsers(existingUsers);
      }

      setCollabUser(me);

      // Messaggio nella inbox admin
      const MSGS_KEY = "admin_messages";
      const msgs = JSON.parse(localStorage.getItem(MSGS_KEY) ?? "[]");
      msgs.unshift({
        id: Date.now().toString(),
        from: userName,
        subject: "Nuova richiesta di collaborazione",
        body: `L'utente "${userName}" vuole collaborare al progetto. Vai in Utenti & Permessi per gestirla.`,
        receivedAt: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem(MSGS_KEY, JSON.stringify(msgs));

      // Invia email via EmailJS con i link per approvare/rifiutare
      const acceptLink = `${window.location.origin}/collab/approve?status=accepted&user=${encodeURIComponent(userName)}`;
      const rejectLink = `${window.location.origin}/collab/approve?status=rejected&user=${encodeURIComponent(userName)}`;

      await emailjs.send(
        "service_fu31pxb",
        "template_collab",
        {
          from_name: userName,
          message: `Nuova richiesta di collaborazione da "${userName}" su Music Hub.\n\nPer approvare clicca qui:\n${acceptLink}\n\nPer rifiutare clicca qui:\n${rejectLink}`,
          to_name: "Admin",
          reply_to: "noreply@musichub.app",
        },
        "j3z-hU3f_1v_x-b1E",
      );

      // Increment count on success
      sessionStorage.setItem("collab_requests_sent", (sessionCount + 1).toString());

      toast({
        title: "✓ Richiesta inviata",
        description: "Il titolare riceverà una notifica",
      });
    } catch (err) {
      toast({
        title: "Richiesta registrata",
        description: "Salvata localmente, l'email potrebbe non essere partita",
      });
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      const existing = await getAdminFeedbacks();
      existing.unshift({
        id: Date.now().toString(),
        userName: userName,
        type: feedbackType,
        message: feedbackText,
        submittedAt: new Date().toISOString(),
        read: false,
      });
      await saveAdminFeedbacks(existing);
      toast({
        title: "✓ Feedback inviato",
        description: "Grazie per il tuo contributo!",
      });
      setFeedbackText("");
      setShowFeedbackPage(false);
    } catch (e) {
      toast({
        title: "Errore",
        description: "Non è stato possibile inviare il feedback.",
        variant: "destructive",
      });
    }
  };

  if (showFeedbackPage) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFeedbackPage(false)}
            className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">Invia Feedback</h2>
        </div>
        <div className="flex-1 rounded-2xl border border-dashed border-border bg-secondary/20 p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Categoria
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="Migliorie">Migliorie</option>
              <option value="Fix bug">Fix bug</option>
              <option value="Aggiunte">Aggiunte</option>
              <option value="Varie">Varie</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Messaggio (Max 2000 car.)
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value.slice(0, 2000))}
              placeholder="Scrivi qui il tuo feedback..."
              className="w-full h-32 bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
            />
            <div className="text-right text-[10px] text-muted-foreground mt-1">
              {feedbackText.length}/2000
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSendFeedback}
            disabled={!feedbackText.trim()}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Invia
          </button>
        </div>
      </div>
    );
  }

  if (showCollabPage) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowCollabPage(false)}
            className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-lg font-bold">Impostazioni Collaboratore</h2>
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-dashed border-border bg-secondary/20 p-4 overflow-y-auto">
          {collabUser?.status === "accepted" ? (
            <div className="space-y-3 animate-in slide-in-from-top-2 opacity-1 fade-in duration-200">
              <div className="flex items-center gap-3 p-3 bg-green-600 text-white rounded-xl">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold">
                  Collaborazione Attiva
                </span>
              </div>

              {collabUser.permissions?.canAccessGithub && (
                <button
                  onClick={() =>
                    window.open(
                      "https://github.com/gabbb328/Music-Hub",
                      "_blank",
                    )
                  }
                  className="w-full py-3 rounded-xl bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  Apri GitHub del sito
                </button>
              )}

              {collabUser.permissions?.canAccessAdmin && (
                <button
                  onClick={() => window.open(`${window.location.origin}/admin`)}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Accedi alla Dashboard Admin
                </button>
              )}

              {collabUser.credentials &&
                (collabUser.credentials.username ||
                  collabUser.credentials.password) && (
                  <div className="mt-4 p-4 rounded-xl bg-secondary/40 border border-border space-y-3 text-left">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Credenziali Admin
                    </p>
                    {collabUser.credentials.username && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Nome utente / Email
                        </p>
                        <p className="text-sm font-mono bg-background/50 p-2 rounded-lg border border-border select-all">
                          {collabUser.credentials.username}
                        </p>
                      </div>
                    )}
                    {collabUser.credentials.password && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Password
                        </p>
                        <div className="relative flex items-center">
                          <p className="w-full text-sm font-mono bg-background/50 p-2 pr-10 rounded-lg border border-border select-all">
                            {showCollabPassword
                              ? collabUser.credentials.password
                              : "••••••••"}
                          </p>
                          <button
                            onClick={() =>
                              setShowCollabPassword(!showCollabPassword)
                            }
                            className="absolute right-2 p-1.5 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                            type="button"
                          >
                            {showCollabPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Sezione Permessi & Integrazioni */}
              {isSuper || collabUser.permissions?.canModifySettings ? (
                <>
                  {/* Visualizzazione Permessi Attivi */}
                  <div className="mt-4 p-4 rounded-xl bg-secondary/40 border border-border space-y-3 text-left">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      I Tuoi Permessi Attivi
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Dot active={!!collabUser.permissions?.canViewStats} />
                        <span>Statistiche Spotify</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Dot active={!!collabUser.permissions?.canViewToken} />
                        <span>Visualizzazione Token</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Dot
                          active={!!collabUser.permissions?.canAccessGithub}
                        />
                        <span>Accesso GitHub</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Dot
                          active={!!collabUser.permissions?.canAccessAdmin}
                        />
                        <span>Accesso Dashboard Admin</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Dot
                          active={
                            !!collabUser.permissions?.canAccessInfrastructure
                          }
                        />
                        <span>Accesso Infrastruttura</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Dot
                          active={!!collabUser.permissions?.canModifySettings}
                        />
                        <span>Modifica Impostazioni</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Dot
                          active={
                            !!collabUser.permissions?.canModifyGlobalSettings
                          }
                        />
                        <span>Modifica Globali</span>
                      </div>
                    </div>
                  </div>

                  {/* Sezione Telegram Integration */}
                  {collabUser.telegramEnabled && (
                    <div className="mt-4 p-4 rounded-xl bg-secondary/40 border border-border space-y-3 text-left">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <span style={{ color: "#2CA5E0" }}>✈️</span> Notifiche
                        Telegram
                      </p>
                      {!collabUser.telegramChatId ? (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            L'amministratore ha abilitato le notifiche Telegram
                            per il tuo account. Inserisci il tuo Chat ID per
                            ricevere aggiornamenti.
                          </p>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Inserisci Telegram Chat ID"
                              value={tempChatId}
                              onChange={(e) =>
                                setTempChatId(e.target.value.replace(/\D/g, ""))
                              }
                              className="w-full bg-background border border-border focus:border-[#2CA5E0] rounded-xl py-2 px-3 text-sm outline-none transition-all text-white"
                            />
                            <button
                              onClick={handleSaveChatId}
                              disabled={!tempChatId.trim()}
                              style={{ backgroundColor: "#2CA5E0" }}
                              className="w-full py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-95 transition-opacity disabled:opacity-40"
                            >
                              Collega account
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">
                            Tip: Trova il tuo Chat ID cercando @userinfobot su
                            Telegram e avviando la chat.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-xs font-semibold text-green-300">
                                Telegram collegato
                              </span>
                            </div>
                            <button
                              onClick={handleRemoveChatId}
                              className="text-[10px] text-red-400 hover:text-red-300 underline font-medium"
                            >
                              Scollega
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                "https://t.me/Music_hub64_bot",
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            style={{ backgroundColor: "#2CA5E0" }}
                            className="w-full py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-95 transition-opacity mt-1"
                          >
                            Apri Chat Bot
                          </button>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            Chat ID: {collabUser.telegramChatId}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-secondary/10 border border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Le tue integrazioni e permessi sono gestiti
                    dall'amministratore.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Invia la richiesta per collaborare e sbloccare i pulsanti.
              </p>
              <button
                onClick={sendCollabRequest}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Collabora
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profilo */}
      <SectionBox icon={Settings2} title="Profilo">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{userName}</p>

            <p className="text-xs text-muted-foreground mt-1">
              Connesso con Spotify
            </p>
          </div>
        </div>
      </SectionBox>

      {/* Informazioni */}
      <SectionBox icon={Info} title="Informazioni account">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Piano</span>
            <span className="font-medium text-primary">Spotify Premium</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Connessione</span>

            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Attiva
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Dispositivo</span>

            <span className="font-medium truncate max-w-[140px] text-right">
              {playbackState?.device?.name || "Nessuno"}
            </span>
          </div>
        </div>
      </SectionBox>

      {/* Preferenze */}
      <SectionBox icon={Sparkles} title="Preferenze">
        <div className="space-y-2">
          <button className="w-full p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors text-sm font-medium text-left">
            Gestisci cache
          </button>

          <button className="w-full p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors text-sm font-medium text-left">
            Cancella dati offline
          </button>

          <button className="w-full p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors text-sm font-medium text-left">
            Esporta impostazioni
          </button>
        </div>
      </SectionBox>

      {/* App */}
      <SectionBox icon={Info} title="Applicazione">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Versione</span>
            <span className="font-medium">Music-Hub v1.4.0</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Database</span>
            {isSupabaseConfigured() ? (
              <span className="font-semibold text-green-400">Supabase Connesso</span>
            ) : (
              <span className="font-semibold text-amber-500">LocalStorage (Offline)</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Build</span>
            <span className="font-medium">2026.05</span>
          </div>
        </div>
      </SectionBox>

      {/* Footer */}
      <div className="pt-2 border-t border-border space-y-2">
        {collabUser?.status !== "accepted" ? (
          <>
            <button
              onClick={() => setShowFeedbackPage(true)}
              className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition-colors"
            >
              Invia Feedback
            </button>
            <button
              onClick={() =>
                collabUser?.status !== "pending" && setShowCollabPage(true)
              }
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                collabUser?.status === "pending"
                  ? "bg-amber-600/35 text-white/50 cursor-default"
                  : "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
              }`}
            >
              {collabUser?.status === "pending" ? (
                <>
                  <Clock3 className="w-4 h-4 text-amber-500" />
                  In attesa di approvazione
                </>
              ) : (
                "Collabora con noi"
              )}
            </button>
          </>
        ) : (
          <>
            <div className="w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-default">
              <CheckCircle2 className="w-4 h-4" />
              Collaborazione Attiva
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCollabPage(true)}
                className="py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Impostazioni
              </button>
              <button
                onClick={() => setShowFeedbackPage(true)}
                className="py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-500 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Feedback
              </button>
            </div>
          </>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive font-semibold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout da Spotify
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Modifiche salvate automaticamente
        </p>
      </div>
    </div>
  );
}

// PANEL PRINCIPALE
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "aspetto", label: "Aspetto", icon: Palette },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "cuffie", label: "Cuffie", icon: Headphones },
  { id: "account", label: "Account", icon: Settings2 },
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-xl font-bold">Impostazioni</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
              {TABS.map((tab) => {
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
                      <motion.div
                        layoutId="tab-indicator"
                        className="w-1 h-1 rounded-full bg-primary"
                      />
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
                  {activeTab === "audio" && <TabAudio />}
                  {activeTab === "cuffie" && <TabCuffie />}
                  {activeTab === "account" && (
                    <TabAccount handleLogout={handleLogout} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
