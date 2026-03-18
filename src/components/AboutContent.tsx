import { motion } from "framer-motion";
import { Github, Globe, Heart, Music2, Code2, Sparkles, Coffee } from "lucide-react";

const TEAM = [
  {
    name: "Harmony Hub",
    role: "App di musica personale",
    avatar: "🎵",
    bio: "Un player musicale moderno con integrazione Spotify, AI DJ, Neural Space Mixer e molto altro.",
    links: [],
  },
];

const STACK = [
  { name: "React + TypeScript", desc: "Frontend", color: "#3b82f6" },
  { name: "Vite", desc: "Build tool", color: "#9333ea" },
  { name: "Tailwind CSS", desc: "Stile", color: "#06b6d4" },
  { name: "Framer Motion", desc: "Animazioni", color: "#ec4899" },
  { name: "TanStack Query", desc: "Data fetching", color: "#f59e0b" },
  { name: "Spotify Web API", desc: "Musica", color: "#1db954" },
  { name: "Web Audio API", desc: "EQ / Mixer", color: "#ef4444" },
  { name: "Claude AI", desc: "AI DJ consigli", color: "#8b5cf6" },
];

const FEATURES = [
  "🎧 Spotify Integration completa",
  "🎛 Neural Space Mixer 3D (HRTF)",
  "🤖 AI DJ con consigli in tempo reale",
  "🎵 Testi sincronizzati",
  "📊 Analisi audio avanzata",
  "🌈 Tema dinamico dalla copertina",
  "⚡ Equalizzatore 10 bande",
  "🎤 Riconoscimento brani",
  "📻 Radio personalizzata",
  "📱 PWA mobile-first",
];

export default function AboutContent() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-6">
          <div className="text-6xl">🎵</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Harmony Hub
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
            Il tuo player musicale personale, costruito con amore e tanta musica.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-red-400 fill-current" />
            <span>Fatto con passione per la musica</span>
          </div>
        </motion.div>

        {/* Feature list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-secondary/30 p-5 space-y-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Funzionalità
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {FEATURES.map((f, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="text-sm text-muted-foreground">
                {f}
              </motion.p>
            ))}
          </div>
        </motion.div>

        {/* Stack */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-secondary/30 p-5 space-y-3">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" /> Tecnologie
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {STACK.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background/40">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info versione */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="rounded-2xl bg-secondary/30 p-5 space-y-2">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Music2 className="w-4 h-4 text-primary" /> Info app
          </h2>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Versione</span><span className="font-mono text-foreground">1.0.0</span></div>
            <div className="flex justify-between"><span>Licenza</span><span className="text-foreground">Uso personale</span></div>
            <div className="flex justify-between"><span>Spotify API</span><span className="text-green-400">✓ Connessa</span></div>
            <div className="flex justify-between"><span>Claude AI</span><span className="text-violet-400">✓ Integrata</span></div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="text-center text-xs text-muted-foreground/50 pb-8 space-y-1">
          <p>Harmony Hub non è affiliata con Spotify AB.</p>
          <p>Spotify® è un marchio registrato di Spotify AB.</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Coffee className="w-3 h-3" />
            <span>Built with late-night energy</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
