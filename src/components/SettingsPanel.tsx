import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Palette, Music, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { usePlaybackState } from "@/hooks/useSpotify";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Check } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const colorThemes = [
  { id: "blue", name: "Ocean Blue", color: "hsl(217, 91%, 60%)" },
  { id: "purple", name: "Royal Purple", color: "hsl(271, 91%, 65%)" },
  { id: "violet", name: "Deep Violet", color: "hsl(250, 85%, 70%)" },
  { id: "emerald", name: "Emerald", color: "hsl(158, 86%, 55%)" },
  { id: "teal", name: "Teal Wave", color: "hsl(178, 90%, 55%)" },
  { id: "amber", name: "Golden Amber", color: "hsl(43, 96%, 60%)" },
  { id: "rose", name: "Rose Garden", color: "hsl(355, 91%, 65%)" },
  { id: "crimson", name: "Crimson Red", color: "hsl(0, 91%, 71%)" },
  { id: "indigo", name: "Indigo Night", color: "hsl(239, 90%, 70%)" },
  { id: "lime", name: "Electric Lime", color: "hsl(85, 90%, 55%)" },
  { id: "sky", name: "Sky Blue", color: "hsl(200, 98%, 60%)" },
  { id: "fuchsia", name: "Fuchsia Pink", color: "hsl(300, 91%, 73%)" },
] as const;

const iconsList = [
  { id: "auto", name: "Auto (Dynamic)" },
  { id: "app_arancione_chiaro.png", name: "Orange Light", src: "/icons/app_arancione_chiaro.png" },
  { id: "app_arancione_scuro.png", name: "Orange Dark", src: "/icons/app_arancione_scuro.png" },
  { id: "app_azzurro_chiaro.png", name: "Light Blue Light", src: "/icons/app_azzurro_chiaro.png" },
  { id: "app_azzurro_scuro.png", name: "Light Blue Dark", src: "/icons/app_azzurro_scuro.png" },
  { id: "app_blu_chiaro.png", name: "Blue Light", src: "/icons/app_blu_chiaro.png" },
  { id: "app_blu_scuro.png", name: "Blue Dark", src: "/icons/app_blu_scuro.png" },
  { id: "app_rosa_chiaro.png", name: "Pink Light", src: "/icons/app_rosa_chiaro.png" },
  { id: "app_rosa_scuro.png", name: "Pink Dark", src: "/icons/app_rosa_scuro.png" },
  { id: "app_rosso_chiaro.png", name: "Red Light", src: "/icons/app_rosso_chiaro.png" },
  { id: "app_rosso_scuro.png", name: "Red Dark", src: "/icons/app_rosso_scuro.png" },
  { id: "app_verde_chiaro.png", name: "Green Light", src: "/icons/app_verde_chiaro.png" },
  { id: "app_verde_scuro.png", name: "Green Dark", src: "/icons/app_verde_scuro.png" },
  { id: "app_viola_chiaro.png", name: "Purple Light", src: "/icons/app_viola_chiaro.png" },
  { id: "app_viola_scuro.png", name: "Purple Dark", src: "/icons/app_viola_scuro.png" },
] as const;

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { theme, colorTheme, setTheme, setColorTheme, autoDarkMode, setAutoDarkMode, activeAppIcon, setActiveAppIcon } = useTheme();
  const { data: playbackState } = usePlaybackState();
  
  const currentTrackImage = playbackState?.item?.album?.images?.[0]?.url;
  const currentTrackName = playbackState?.item?.name;
  const currentArtist = playbackState?.item?.artists?.[0]?.name;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-bold">Settings</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Theme</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Light</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Dark</p>
                  </motion.button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Accent Color</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setColorTheme("dynamic")}
                    className={`col-span-2 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                      colorTheme === "dynamic"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {currentTrackImage ? (
                      <>
                        <div 
                          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30"
                          style={{ backgroundImage: `url(${currentTrackImage})` }}
                        />
                        <div className="relative flex items-center gap-3">
                          <img 
                            src={currentTrackImage} 
                            alt="Album cover"
                            className="w-12 h-12 rounded-lg object-cover shadow-lg"
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                            <p className="text-sm font-bold truncate">Dynamic Theme</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {currentTrackName} • {currentArtist}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 py-2">
                        <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-primary/40 via-accent/40 to-secondary/40 flex items-center justify-center">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold flex items-center gap-2">Dynamic Theme</p>
                          <p className="text-xs text-muted-foreground">Adapts to current song</p>
                        </div>
                      </div>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {colorTheme === "dynamic" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="col-span-2 p-4 rounded-xl border-2 border-border bg-secondary/30"
                      >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold mb-1">Auto Light/Dark Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Automatically switch theme based on album brightness
                          </p>
                        </div>
                        <button
                          onClick={() => setAutoDarkMode(!autoDarkMode)}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                            autoDarkMode ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <motion.div
                            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                            animate={{ x: autoDarkMode ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {colorThemes.map((color) => (
                    <motion.button
                      key={color.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setColorTheme(color.id as any)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        colorTheme === color.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/50"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full mx-auto mb-2 ring-2 ring-offset-2 ring-offset-background transition-all"
                        style={{ 
                          backgroundColor: color.color,
                          '--tw-ring-color': colorTheme === color.id ? color.color : "transparent"
                        } as any}
                      />
                      <p className="text-xs font-medium truncate">{color.name}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <img src="/icons/app_blu_scuro.png" alt="" className="w-5 h-5 rounded" />
                  <h3 className="text-lg font-semibold">App Icon</h3>
                </div>

                <div className="p-4 rounded-xl border-2 border-border bg-secondary/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1">Select Icon</p>
                      <p className="text-xs text-muted-foreground mr-4">
                        Change the appearance of the application icon.
                      </p>
                    </div>
                  </div>
                  
                  <Select value={activeAppIcon} onValueChange={setActiveAppIcon}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconsList.map((icon) => (
                        <SelectItem key={icon.id} value={icon.id} className="flex items-center gap-3">
                          <div className="flex items-center gap-3">
                            {(icon as any).src ? (
                              <img src={(icon as any).src} alt="" className="w-6 h-6 rounded" />
                            ) : (
                              <Sparkles className="w-6 h-6 text-primary p-1 bg-primary/20 rounded" />
                            )}
                            <span>{icon.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="p-6 rounded-xl bg-secondary/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="h-4 bg-foreground/80 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted-foreground/50 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-primary rounded-lg" />
                    <div className="flex-1 h-10 bg-secondary rounded-lg" />
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Changes are saved automatically
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
