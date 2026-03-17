import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Palette, Sparkles, LogOut, ImageIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { clearToken } from "@/services/spotify-auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlaybackState } from "@/hooks/useSpotify";
import { Check } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

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

// Tutte le icone disponibili nella cartella /public/icons
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

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    theme, colorTheme, setTheme, setColorTheme,
    autoDarkMode, setAutoDarkMode,
    activeAppIcon, setActiveAppIcon,
  } = useTheme();

  const { data: playbackState } = usePlaybackState();
  const navigate = useNavigate();

  const handleLogout = () => { clearToken(); navigate("/login"); onClose(); };

  const currentTrackImage = playbackState?.item?.album?.images?.[0]?.url;
  const currentTrackName  = playbackState?.item?.name;
  const currentArtist     = playbackState?.item?.artists?.[0]?.name;

  // Icona attualmente selezionata (per preview)
  const selectedIcon = iconsList.find(i => i.id === activeAppIcon) ?? iconsList[0];

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
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <h2 className="text-2xl font-bold">Impostazioni</h2>
              <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* ── TEMA CHIARO / SCURO ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold">Tema</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["light","dark"] as const).map(t => (
                    <motion.button key={t} whileTap={{ scale: 0.97 }} onClick={() => setTheme(t)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      {t === "light" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                      <span className="text-sm font-medium capitalize">{t === "light" ? "Chiaro" : "Scuro"}</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* ── COLORE ACCENTO ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold">Colore accento</h3>
                </div>

                {/* Dynamic */}
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setColorTheme("dynamic")}
                  className={`w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden ${colorTheme === "dynamic" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  {currentTrackImage ? (
                    <>
                      <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30" style={{ backgroundImage: `url(${currentTrackImage})` }} />
                      <div className="relative flex items-center gap-3">
                        <img src={currentTrackImage} alt="" className="w-12 h-12 rounded-lg object-cover shadow-lg shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" />Auto dal brano</p>
                          <p className="text-xs text-muted-foreground truncate">{currentTrackName} · {currentArtist}</p>
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

                {/* Auto dark mode toggle (visibile solo con Dynamic) */}
                <AnimatePresence>
                  {colorTheme === "dynamic" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">Auto Light/Dark</p>
                          <p className="text-xs text-muted-foreground">Cambia tema in base alla luminosità della copertina</p>
                        </div>
                        <button onClick={() => setAutoDarkMode(!autoDarkMode)}
                          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${autoDarkMode ? "bg-primary" : "bg-muted"}`}>
                          <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                            animate={{ x: autoDarkMode ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Griglia colori */}
                <div className="grid grid-cols-2 gap-2">
                  {colorThemes.map(c => (
                    <motion.button key={c.id} whileTap={{ scale: 0.95 }} onClick={() => setColorTheme(c.id as any)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${colorTheme === c.id ? "border-primary bg-primary/10" : "border-border hover:border-border/60"}`}>
                      <div className="w-7 h-7 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-medium truncate">{c.name}</span>
                      {colorTheme === c.id && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* ── ICONA APP ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold">Icona app</h3>
                </div>

                {/* Anteprima icona corrente */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border">
                  {selectedIcon.src ? (
                    <img src={selectedIcon.src} alt="" className="w-14 h-14 rounded-2xl shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{selectedIcon.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeAppIcon === "auto"
                        ? "Si adatta al colore del tema o della copertina importata"
                        : "Icona fissa selezionata manualmente"}
                    </p>
                  </div>
                </div>

                {/* Griglia icone */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Auto */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setActiveAppIcon("auto")}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${activeAppIcon === "auto" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/50 via-violet-500/40 to-pink-500/40 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium leading-none text-center">Auto</span>
                    {activeAppIcon === "auto" && <Check className="w-3 h-3 text-primary" />}
                  </motion.button>

                  {/* Icone manuali */}
                  {iconsList.slice(1).map(icon => (
                    <motion.button
                      key={icon.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setActiveAppIcon(icon.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${activeAppIcon === icon.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <img src={icon.src!} alt={icon.name} className="w-12 h-12 rounded-xl shadow-sm object-cover" />
                      <span className="text-[10px] font-medium leading-none text-center line-clamp-2">{icon.name}</span>
                      {activeAppIcon === icon.id && <Check className="w-3 h-3 text-primary" />}
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* ── PREVIEW ── */}
              <section className="space-y-3">
                <h3 className="text-base font-semibold">Anteprima</h3>
                <div className="p-5 rounded-xl bg-secondary/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-foreground/80 rounded w-3/4" />
                      <div className="h-2.5 bg-muted-foreground/40 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-primary rounded-lg" />
                    <div className="flex-1 h-9 bg-secondary rounded-lg border border-border" />
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary rounded-full" />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border space-y-3 shrink-0">
              <Button variant="destructive" onClick={handleLogout} className="w-full gap-2">
                <LogOut className="w-4 h-4" /> Logout da Spotify
              </Button>
              <p className="text-xs text-muted-foreground text-center">Le modifiche vengono salvate automaticamente</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
