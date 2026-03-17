// ─── StemDetailPanel – side panel for a selected stem ───────────────────────
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, RotateCcw, Lock, Unlock, VolumeX, Volume2, Zap,
} from "lucide-react";
import type { Stem } from "@/types/spatialMixer";

interface Props {
  stem: Stem | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Stem>) => void;
  onReset: (id: string) => void;
}

export default function StemDetailPanel({ stem, onClose, onUpdate, onReset }: Props) {
  if (!stem) return null;

  const u = (patch: Partial<Stem>) => onUpdate(stem.id, patch);

  return (
    <AnimatePresence>
      {stem && (
        <motion.div
          key={stem.id}
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-72 shrink-0 h-full overflow-y-auto bg-card/80 backdrop-blur-xl border-l border-border/50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ background: stem.color }} />
            <span className="font-semibold text-sm flex-1 truncate">{stem.name}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">

            {/* Position info */}
            <Section title="Spatial Position">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <Chip label="Angle" value={`${Math.round(stem.position.angle)}°`} />
                <Chip label="Distance" value={`${Math.round(stem.position.distance * 100)}%`} />
              </div>
            </Section>

            {/* Volume */}
            <Section title="Volume">
              <Slider
                value={stem.volume * 100}
                min={0} max={100}
                onChange={(v) => u({ volume: v / 100 })}
                color={stem.color}
              />
            </Section>

            {/* Pan */}
            <Section title="Pan">
              <Slider
                value={(stem.pan + 1) * 50}
                min={0} max={100}
                onChange={(v) => u({ pan: v / 50 - 1 })}
                color={stem.color}
                centerMark
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>L</span><span>C</span><span>R</span>
              </div>
            </Section>

            {/* Stereo Width */}
            <Section title="Stereo Width">
              <Slider
                value={stem.stereoWidth * 50}
                min={0} max={100}
                onChange={(v) => u({ stereoWidth: v / 50 })}
                color={stem.color}
              />
            </Section>

            {/* Reverb & Delay */}
            <Section title="Send FX">
              <label className="text-xs text-muted-foreground">Reverb</label>
              <Slider
                value={stem.reverbSend * 100}
                min={0} max={100}
                onChange={(v) => u({ reverbSend: v / 100 })}
                color="#818cf8"
              />
              <label className="text-xs text-muted-foreground mt-1 block">Delay</label>
              <Slider
                value={stem.delaySend * 100}
                min={0} max={100}
                onChange={(v) => u({ delaySend: v / 100 })}
                color="#38bdf8"
              />
            </Section>

            {/* EQ */}
            <Section title="EQ (3-band)">
              {(["low", "mid", "high"] as const).map((band) => (
                <div key={band} className="mb-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span className="capitalize">{band}</span>
                    <span>{stem.eq[band] > 0 ? "+" : ""}{stem.eq[band].toFixed(1)} dB</span>
                  </div>
                  <Slider
                    value={stem.eq[band] + 12}
                    min={0} max={24}
                    onChange={(v) => u({ eq: { ...stem.eq, [band]: v - 12 } })}
                    color={band === "low" ? "#fb923c" : band === "mid" ? "#facc15" : "#86efac"}
                    centerMark
                  />
                </div>
              ))}
            </Section>

            {/* Filters */}
            <Section title="Filters">
              <label className="text-xs text-muted-foreground">HPF (Hz)</label>
              <Slider value={stem.hpf} min={0} max={2000} onChange={(v) => u({ hpf: v })} color="#f472b6" />
              <label className="text-xs text-muted-foreground mt-1 block">LPF (Hz)</label>
              <Slider value={stem.lpf === 0 ? 20000 : stem.lpf} min={500} max={20000}
                onChange={(v) => u({ lpf: v === 20000 ? 0 : v })} color="#a78bfa" />
            </Section>

            {/* Actions */}
            <Section title="Actions">
              <div className="grid grid-cols-2 gap-2">
                <ActionBtn
                  label={stem.muted ? "Unmute" : "Mute"}
                  icon={stem.muted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  onClick={() => u({ muted: !stem.muted })}
                  active={stem.muted}
                  activeColor="#f87171"
                />
                <ActionBtn
                  label={stem.locked ? "Unlock" : "Lock"}
                  icon={stem.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  onClick={() => u({ locked: !stem.locked })}
                  active={stem.locked}
                  activeColor="#facc15"
                />
                <ActionBtn
                  label="Reset Pos"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => onReset(stem.id)}
                />
                <ActionBtn
                  label="Bypass"
                  icon={<Zap className="w-3.5 h-3.5" />}
                  onClick={() => u({ volume: stem.volume === 0 ? 0.8 : 0 })}
                />
              </div>
            </Section>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">{title}</p>
      {children}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/60 rounded px-2 py-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Slider({
  value, min, max, onChange, color = "#6366f1", centerMark = false,
}: {
  value: number; min: number; max: number;
  onChange: (v: number) => void;
  color?: string;
  centerMark?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative">
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(100,116,139,0.3) ${pct}%)`,
        }}
      />
      {centerMark && (
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-1.5 bg-muted-foreground/40 pointer-events-none" />
      )}
    </div>
  );
}

function ActionBtn({
  label, icon, onClick, active = false, activeColor = "#6366f1",
}: {
  label: string; icon: React.ReactNode;
  onClick: () => void;
  active?: boolean; activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 justify-center px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
      style={{
        background: active ? `${activeColor}22` : "rgba(100,116,139,0.15)",
        color: active ? activeColor : "rgb(148,163,184)",
        border: `1px solid ${active ? activeColor + "44" : "transparent"}`,
      }}
    >
      {icon}{label}
    </button>
  );
}
