import { motion } from "framer-motion";
import {
  Radio, Mic2, BarChart3, Headphones, Sparkles, Heart, Clock,
  ListMusic, ScanSearch, SlidersHorizontal, Settings, User,
  Layers, Info, Music2, Settings2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MoreContentProps {
  onSectionChange: (section: string) => void;
  onOpenSettings: () => void;
}

const features = [
  { id: "ai-dj",        label: "AI DJ",          icon: Sparkles,         color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: "neural-mixer", label: "Neural Mixer",    icon: Layers,           color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { id: "radio",        label: "Radio",           icon: Radio,            color: "text-blue-400",   bg: "bg-blue-400/10"   },
  { id: "lyrics",       label: "Testi",           icon: Mic2,             color: "text-pink-400",   bg: "bg-pink-400/10"   },
  { id: "recognize",    label: "Riconosci",       icon: ScanSearch,       color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "equalizer",    label: "Equalizzatore",   icon: SlidersHorizontal,color: "text-cyan-400",   bg: "bg-cyan-400/10"   },
  { id: "stats",        label: "Statistiche",     icon: BarChart3,        color: "text-green-400",  bg: "bg-green-400/10"  },
  { id: "devices",      label: "Dispositivi",     icon: Headphones,       color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { id: "samsung-buds", label: "Galaxy Buds",     icon: Music2,           color: "text-blue-300",   bg: "bg-blue-300/10"   },
  { id: "audio-settings",label: "Audio",          icon: Settings2,        color: "text-slate-400",  bg: "bg-slate-400/10"  },
];

const libraryItems = [
  { id: "liked",  label: "Preferiti",        icon: Heart,      color: "text-red-400",     bg: "bg-red-400/10"     },
  { id: "recent", label: "Recenti",          icon: Clock,      color: "text-gray-400",    bg: "bg-gray-400/10"    },
  { id: "queue",  label: "Coda",             icon: ListMusic,  color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

export default function MoreContent({ onSectionChange, onOpenSettings }: MoreContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">

      <h2 className="text-2xl font-bold flex items-center gap-2">
        <User className="w-6 h-6 text-primary" /> Altro
      </h2>

      {/* Feature grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Funzionalità</p>
        <div className="grid grid-cols-2 gap-3">
          {features.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <button
                onClick={() => onSectionChange(item.id)}
                className="w-full glass-surface rounded-xl p-4 flex flex-col items-center gap-2.5 text-center hover:bg-secondary/50 active:scale-95 transition-all min-h-[80px]"
              >
                <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-xs font-semibold leading-tight">{item.label}</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Libreria */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">La tua libreria</p>
        <div className="grid grid-cols-3 gap-2">
          {libraryItems.map((item, i) => (
            <motion.button key={item.id}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => onSectionChange(item.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 active:scale-95 transition-all min-h-[72px]">
              <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* App */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">App</p>
        <div className="space-y-2">
          <button onClick={onOpenSettings}
            className="w-full flex items-center gap-4 p-4 rounded-xl glass-surface hover:bg-secondary/50 active:scale-[0.98] transition-all min-h-[60px]">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">Impostazioni</p>
              <p className="text-xs text-muted-foreground">Tema, icona e account</p>
            </div>
          </button>
          <button onClick={() => onSectionChange("about")}
            className="w-full flex items-center gap-4 p-4 rounded-xl glass-surface hover:bg-secondary/50 active:scale-[0.98] transition-all min-h-[60px]">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">Chi siamo</p>
              <p className="text-xs text-muted-foreground">Autori, stack e versione</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
