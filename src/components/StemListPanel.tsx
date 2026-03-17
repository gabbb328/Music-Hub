// ─── StemListPanel – bottom strip showing all stems ─────────────────────────
import React from "react";
import { motion } from "framer-motion";
import {
  Mic2, Mic, Music2, Guitar, Music, Waves,
  Volume2, VolumeX, Zap, ZapOff,
} from "lucide-react";
import type { Stem } from "@/types/spatialMixer";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Mic2, Mic, Music2, Guitar, Music, Waves,
  Drum: Music2, Piano: Music, Violin: Music2,
  CircleDot: Music, Sparkles: Zap,
};

interface StemListPanelProps {
  stems: Stem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onVolumeChange: (id: string, v: number) => void;
}

export default function StemListPanel({
  stems, selectedId, onSelect,
  onToggleMute, onToggleSolo, onVolumeChange,
}: StemListPanelProps) {
  return (
    <div className="h-44 border-t border-border/50 bg-card/60 backdrop-blur-xl overflow-x-auto overflow-y-hidden">
      <div className="flex gap-2 px-4 py-3 h-full" style={{ minWidth: "max-content" }}>
        {stems.map((stem) => {
          const IconComp = ICON_MAP[stem.icon] ?? Music;
          const isSelected = selectedId === stem.id;

          return (
            <motion.div
              key={stem.id}
              onClick={() => onSelect(stem.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-36 shrink-0 flex flex-col gap-1.5 rounded-xl p-2.5 cursor-pointer transition-colors"
              style={{
                background: isSelected
                  ? `${stem.color}22`
                  : "rgba(30,40,70,0.7)",
                border: `1.5px solid ${isSelected ? stem.color + "88" : "rgba(99,102,241,0.15)"}`,
              }}
            >
              {/* Row: icon + name */}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: stem.color + "33" }}
                >
                  <IconComp className="w-3.5 h-3.5" style={{ color: stem.color }} />
                </div>
                <span className="text-xs font-semibold truncate" style={{ color: stem.muted ? "rgb(100,116,139)" : "rgb(226,232,240)" }}>
                  {stem.name}
                </span>
              </div>

              {/* Mini waveform */}
              {stem.waveformData && (
                <div className="flex items-end gap-px h-6 overflow-hidden rounded">
                  {stem.waveformData.slice(0, 36).map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${v * 100}%`,
                        background: stem.muted ? "rgba(100,116,139,0.4)" : `${stem.color}88`,
                        minWidth: 2,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Volume slider */}
              <input
                type="range" min={0} max={100}
                value={Math.round(stem.volume * 100)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onVolumeChange(stem.id, Number(e.target.value) / 100)}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${stem.color} ${stem.volume * 100}%, rgba(100,116,139,0.3) ${stem.volume * 100}%)`,
                }}
              />

              {/* Mute / Solo */}
              <div className="flex gap-1.5 mt-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleMute(stem.id); }}
                  className="flex-1 flex items-center justify-center gap-1 py-0.5 rounded text-[10px] font-semibold transition-colors"
                  style={{
                    background: stem.muted ? "#f8717133" : "rgba(100,116,139,0.15)",
                    color: stem.muted ? "#f87171" : "rgb(100,116,139)",
                  }}
                >
                  {stem.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  M
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSolo(stem.id); }}
                  className="flex-1 flex items-center justify-center gap-1 py-0.5 rounded text-[10px] font-semibold transition-colors"
                  style={{
                    background: stem.soloed ? "#facc1533" : "rgba(100,116,139,0.15)",
                    color: stem.soloed ? "#facc15" : "rgb(100,116,139)",
                  }}
                >
                  {stem.soloed ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                  S
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
