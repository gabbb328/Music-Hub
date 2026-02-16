import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Palette } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

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

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { theme, colorTheme, setTheme, setColorTheme } = useTheme();

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
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Theme Section */}
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

              {/* Color Theme Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Accent Color</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                          ringColor: colorTheme === color.id ? color.color : "transparent"
                        }}
                      />
                      <p className="text-xs font-medium truncate">{color.name}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Preview */}
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

            {/* Footer */}
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
