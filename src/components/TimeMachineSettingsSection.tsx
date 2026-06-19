/**
 * TimeMachineSettingsSection
 *
 * Componente autonomo usato dentro TabAspetto (SettingsPanel).
 * Mostra: toggle on/off + slider era + anteprima filtro CSS.
 * Lo stato è condiviso via localStorage tramite useTimeMachineSettings.
 *
 * Importa questo componente in SettingsPanel e mettilo in fondo a TabAspetto:
 *   import { TimeMachineSettingsSection } from "@/components/TimeMachineSettingsSection";
 *   ...
 *   <TimeMachineSettingsSection />
 */

import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useTimeMachineSettings, ERA_CONFIGS } from "@/hooks/useTimeMachineSettings";

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

export function TimeMachineSettingsSection() {
  const { enabled, eraIndex, currentConfig, setEnabled, setEraIndex } =
    useTimeMachineSettings();

  return (
    <SectionBox icon={Clock} title="Time Machine">
      {/* Toggle on/off */}
      <div className="flex items-center justify-between gap-3 py-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Filtro estetico per era</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applica un effetto visivo e filtra i brani per decennio nella Home
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${enabled ? "bg-primary" : "bg-secondary"}`}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
            animate={{ x: enabled ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Contenuto espandibile quando attivo */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden space-y-3"
          >
            {/* Slider ere */}
            <div className="space-y-2 pt-1">
              <input
                type="range"
                min={0}
                max={ERA_CONFIGS.length - 1}
                step={1}
                value={eraIndex}
                onChange={(e) => setEraIndex(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={
                  currentConfig
                    ? { accentColor: currentConfig.accent }
                    : {}
                }
              />
              {/* Label ere */}
              <div className="flex justify-between">
                {ERA_CONFIGS.map((era, i) => (
                  <button
                    key={era.id}
                    onClick={() => setEraIndex(i)}
                    className={[
                      "text-[9px] transition-all leading-tight text-center w-8",
                      i === eraIndex
                        ? "font-black text-foreground"
                        : "text-muted-foreground/50 hover:text-muted-foreground",
                    ].join(" ")}
                    style={
                      i === eraIndex && currentConfig
                        ? { color: currentConfig.accent }
                        : {}
                    }
                  >
                    {era.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge era corrente */}
            <AnimatePresence mode="wait">
              {currentConfig && (
                <motion.div
                  key={currentConfig.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    backgroundColor: `${currentConfig.accent}15`,
                    borderLeft: `3px solid ${currentConfig.accent}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: currentConfig.accent }}>
                      {currentConfig.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {currentConfig.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Brani: {currentConfig.yearRange[0]}–{currentConfig.yearRange[1]}
                    </p>
                  </div>
                  <button
                    onClick={() => setEnabled(false)}
                    className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0 mt-0.5"
                    aria-label="Disattiva filtro"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              L'effetto visivo si applica all'intera interfaccia
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionBox>
  );
}
