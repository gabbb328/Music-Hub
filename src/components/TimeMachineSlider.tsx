/**
 * TimeMachineSlider
 *
 * Componente Fase 2: slider temporale che cambia l'estetica dell'UI
 * e filtra i brani per decennio.
 *
 * Uso (es. in HomeContent o LibraryContent):
 *   const tm = useTimeMachine();
 *   <TimeMachineSlider
 *     sliderIndex={tm.sliderIndex}
 *     onChange={tm.handleSliderChange}
 *     onReset={tm.resetEra}
 *     activeConfig={tm.currentConfig}
 *   />
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";
import { ERA_CONFIGS } from "@/hooks/useTimeMachine";
import type { EraConfig } from "@/types/features";

interface TimeMachineSliderProps {
  sliderIndex: number;
  onChange: (index: number) => void;
  onReset: () => void;
  activeConfig: EraConfig | null;
}

const TimeMachineSlider: React.FC<TimeMachineSliderProps> = ({
  sliderIndex,
  onChange,
  onReset,
  activeConfig,
}) => {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Time Machine</span>
        </div>
        <AnimatePresence>
          {activeConfig && (
            <motion.button
              key="reset"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/40"
            >
              <X className="w-3 h-3" /> Rimuovi filtro
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={ERA_CONFIGS.length - 1}
          step={1}
          value={sliderIndex}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={
            activeConfig
              ? ({
                  "--tw-accent": activeConfig.accent,
                  accentColor: activeConfig.accent,
                } as React.CSSProperties)
              : {}
          }
        />
        {/* Tick labels */}
        <div className="flex justify-between">
          {ERA_CONFIGS.map((era, i) => (
            <button
              key={era.id}
              onClick={() => onChange(i)}
              className={[
                "text-[10px] transition-all leading-tight text-center",
                i === sliderIndex
                  ? "font-bold text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground",
              ].join(" ")}
              style={i === sliderIndex ? { color: activeConfig?.accent } : {}}
            >
              {era.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badge era attiva */}
      <AnimatePresence mode="wait">
        {activeConfig && (
          <motion.div
            key={activeConfig.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
            style={{
              backgroundColor: `${activeConfig.accent}18`,
              borderLeft: `3px solid ${activeConfig.accent}`,
            }}
          >
            <span className="font-bold" style={{ color: activeConfig.accent }}>
              {activeConfig.label}
            </span>
            <span className="text-muted-foreground text-xs">
              {activeConfig.description}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimeMachineSlider;
