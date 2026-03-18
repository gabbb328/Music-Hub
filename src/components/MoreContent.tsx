import { motion } from "framer-motion";
import {
  Radio, Mic2, BarChart3, Headphones, Sparkles, Heart, Clock,
  ListMusic, ScanSearch, SlidersHorizontal, Settings, User,
  Layers, Info, Music2, Settings2
} from "lucide-react";
import { useSquish } from "@/hooks/useSquish";

interface MoreContentProps {
  onSectionChange: (section: string) => void;
  onOpenSettings: () => void;
}

const features = [
  { id: "ai-dj",         label: "AI DJ",          icon: Sparkles,          color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: "neural-mixer",  label: "Neural Mixer",   icon: Layers,            color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { id: "radio",         label: "Radio",           icon: Radio,             color: "text-blue-400",   bg: "bg-blue-400/10"   },
  { id: "lyrics",        label: "Testi",           icon: Mic2,              color: "text-pink-400",   bg: "bg-pink-400/10"   },
  { id: "recognize",     label: "Riconosci",       icon: ScanSearch,        color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "equalizer",     label: "Equalizzatore",   icon: SlidersHorizontal, color: "text-cyan-400",   bg: "bg-cyan-400/10"   },
  { id: "stats",         label: "Statistiche",     icon: BarChart3,         color: "text-green-400",  bg: "bg-green-400/10"  },
  { id: "devices",       label: "Dispositivi",     icon: Headphones,        color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { id: "samsung-buds",  label: "Galaxy Buds",     icon: Music2,            color: "text-blue-300",   bg: "bg-blue-300/10"   },
  { id: "audio-settings",label: "Audio",           icon: Settings2,         color: "text-slate-400",  bg: "bg-slate-400/10"  },
];

const libraryItems = [
  { id: "liked",  label: "Preferiti", icon: Heart,     color: "text-red-400",     bg: "bg-red-400/10"     },
  { id: "recent", label: "Recenti",   icon: Clock,     color: "text-gray-400",    bg: "bg-gray-400/10"    },
  { id: "queue",  label: "Coda",      icon: ListMusic, color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

// Squish options per la griglia 2-colonne (adiacente = dx/sx, indice ±1 nella stessa riga)
const GRID_SQUISH = {
  activeScale:    1.1,
  neighborScale:  0.9,
  farScale:       0.96,
  neighborRadius: 1,
  spring: { stiffness: 420, damping: 26, mass: 0.7 },
};

const LIB_SQUISH = {
  activeScale:    1.14,
  neighborScale:  0.86,
  farScale:       0.94,
  neighborRadius: 1,
  spring: { stiffness: 440, damping: 26, mass: 0.65 },
};

export default function MoreContent({ onSectionChange, onOpenSettings }: MoreContentProps) {
  const featureSquish = useSquish(features.length, GRID_SQUISH);
  const libSquish     = useSquish(libraryItems.length, LIB_SQUISH);

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">

      <motion.h2
        className="text-2xl font-bold flex items-center gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <User className="w-6 h-6 text-primary" /> Altro
      </motion.h2>

      {/* Feature grid — squish a 2 colonne */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
          Funzionalità
        </p>
        <div className="grid grid-cols-2 gap-3">
          {features.map((item, i) => (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="glass-surface rounded-2xl p-4 flex flex-col items-center gap-2.5 text-center min-h-[88px] focus:outline-none"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, ...featureSquish.getProps(i).animate }}
              transition={{ delay: i * 0.03, ...featureSquish.getProps(i).transition }}
              onPointerDown={featureSquish.getProps(i).onPointerDown}
              onPointerUp={featureSquish.getProps(i).onPointerUp}
              onPointerLeave={featureSquish.getProps(i).onPointerLeave}
              onPointerCancel={featureSquish.getProps(i).onPointerCancel}
            >
              <motion.div
                className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center`}
                animate={{
                  scale: featureSquish.pressedIndex === i ? 1.12 : 1,
                }}
                transition={featureSquish.getProps(i).transition}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </motion.div>
              <span className="text-xs font-semibold leading-tight">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Libreria — squish a 3 colonne */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
          La tua libreria
        </p>
        <div className="grid grid-cols-3 gap-2">
          {libraryItems.map((item, i) => (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl focus:outline-none min-h-[80px]"
              animate={libSquish.getProps(i).animate}
              transition={libSquish.getProps(i).transition}
              onPointerDown={libSquish.getProps(i).onPointerDown}
              onPointerUp={libSquish.getProps(i).onPointerUp}
              onPointerLeave={libSquish.getProps(i).onPointerLeave}
              onPointerCancel={libSquish.getProps(i).onPointerCancel}
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* App */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">App</p>
        <div className="space-y-2">
          {[
            {
              onClick: onOpenSettings,
              icon: Settings, iconColor: "text-primary", iconBg: "bg-primary/10",
              label: "Impostazioni", sub: "Tema, icona e account",
            },
            {
              onClick: () => onSectionChange("about"),
              icon: Info, iconColor: "text-violet-400", iconBg: "bg-violet-500/10",
              label: "Chi siamo", sub: "Autori, stack e versione",
            },
          ].map(({ onClick, icon: Icon, iconColor, iconBg, label, sub }, i) => (
            <motion.button
              key={label}
              onClick={onClick}
              className="w-full flex items-center gap-4 p-4 rounded-2xl glass-surface focus:outline-none"
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.6 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
