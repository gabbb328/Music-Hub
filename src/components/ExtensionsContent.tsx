import { motion } from "framer-motion";
import {
  Sparkles,
  Layers,
  Sliders,
  Radio,
  Mic2,
  ScanSearch,
  BarChart3,
  Headphones,
  Gamepad2,
  Calendar,
  Users,
  BookOpen,
  ArrowRight,
  Zap,
  Info,
  AppWindow
} from "lucide-react";

interface ExtensionsContentProps {
  onSectionChange: (section: string) => void;
}

export const EXTENSION_ITEMS = [
  {
    id: "ai-dj",
    title: "AI DJ",
    subtitle: "Mix e raccomandazioni intelligenti basati sul tuo BPM",
    category: "Intelligenza Artificiale",
    icon: Sparkles,
    color: "from-purple-500 to-indigo-600",
    badge: "AI Powered",
  },
  {
    id: "neural-mixer",
    title: "Neural Space Mixer",
    subtitle: "Mixer audio 3D spaziale e modulazione in tempo reale",
    category: "Audio Pro",
    icon: Layers,
    color: "from-indigo-500 to-cyan-600",
    badge: "3D Audio",
  },
  {
    id: "equalizer",
    title: "Equalizzatore Multibanda",
    subtitle: "Personalizza frequenze, bassi e preset di riproduzione",
    category: "Audio Pro",
    icon: Sliders,
    color: "from-blue-500 to-emerald-600",
    badge: "DSP Effects",
  },
  {
    id: "radio",
    title: "Radio Hub Live",
    subtitle: "Stazioni radio globali e streaming live sintonizzato",
    category: "Streaming",
    icon: Radio,
    color: "from-amber-500 to-red-600",
    badge: "Live Radio",
  },
  {
    id: "lyrics",
    title: "Testi & Karaoke",
    subtitle: "Testi sincronizzati riga per riga con modalità karaoke",
    category: "Player Extra",
    icon: Mic2,
    color: "from-pink-500 to-rose-600",
    badge: "Lyrics Sync",
  },
  {
    id: "recognize",
    title: "Riconosci Brano",
    subtitle: "Shazam integrato per identificare qualsiasi traccia",
    category: "Utility",
    icon: ScanSearch,
    color: "from-orange-500 to-amber-600",
    badge: "Audio Recognition",
  },
  {
    id: "stats",
    title: "Statistiche & Analytics",
    subtitle: "Grafici dettagliati dei tuoi ascolti e top artisti",
    category: "Analytics",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
    badge: "Data & Stats",
  },
  {
    id: "devices",
    title: "Gestione Dispositivi",
    subtitle: "Controlla casse, cuffie e dispositivi connessi",
    category: "Hardware",
    icon: Headphones,
    color: "from-cyan-500 to-blue-600",
    badge: "Connect",
  },
  {
    id: "games",
    title: "Music Games & Quiz",
    subtitle: "Sfide ritmiche, music quiz e giochi interattivi",
    category: "Intrattenimento",
    icon: Gamepad2,
    color: "from-violet-500 to-fuchsia-600",
    badge: "Minigames",
  },
  {
    id: "mood",
    title: "Mood Generator",
    subtitle: "Crea playlist personalizzate in base al tuo umore",
    category: "AI & Mood",
    icon: Sparkles,
    color: "from-yellow-500 to-orange-600",
    badge: "Mood Gen",
  },
  {
    id: "mood-calendar",
    title: "Diario Musicale",
    subtitle: "Traccia la tua mappa emotiva giorno dopo giorno",
    category: "AI & Mood",
    icon: BookOpen,
    color: "from-teal-500 to-emerald-600",
    badge: "Diario",
  },
  {
    id: "listen-along",
    title: "Listen Along",
    subtitle: "Ascolta la musica in sincrono con i tuoi amici",
    category: "Social",
    icon: Users,
    color: "from-sky-500 to-indigo-600",
    badge: "Party Sync",
  },
];

export default function ExtensionsContent({ onSectionChange }: ExtensionsContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 relative">
      {/* Glow background decorativo */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[130px] z-0" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-500/10 blur-[130px] z-0" />

      <div className="relative z-10 space-y-6">
        {/* Header Sezione */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20 flex items-center gap-1.5">
                <AppWindow className="w-3.5 h-3.5" />
                Sottocategoria Estensioni
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Estensioni & App
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Tutte le funzionalità speciali, mixer audio, strumenti AI e giochi musicali di Music Hub organizzati in un'unica suite.
            </p>
          </div>
        </div>

        {/* Grid delle Estensioni */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXTENSION_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 24 }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSectionChange(item.id)}
                className="group relative rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-white/10 p-5 shadow-xl backdrop-blur-xl cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Glow on Hover */}
                <div
                  className={`absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/60 text-muted-foreground border border-border">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Apri estensione</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
