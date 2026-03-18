import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings2, Music2, Zap, Volume2, Timer, Radio, Wifi,
  Download, Upload, Moon, Bell, Smartphone, Save, RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Tipi ─────────────────────────────────────────────────────────────────────
interface AudioSettings {
  streamingQuality: "low" | "normal" | "high" | "very_high";
  downloadQuality: "low" | "normal" | "high" | "very_high";
  crossfadeSec: number;      // 0-12
  loudnessNorm: boolean;
  gaplessPlayback: boolean;
  monoAudio: boolean;
  hardwareAccel: boolean;
  autoplayEnabled: boolean;
  showUnplayable: boolean;
  syncLocalFiles: boolean;
}

const QUALITY_LABELS: Record<string, string> = {
  low:       "Bassa  (~96 kbps)",
  normal:    "Normale (~160 kbps)",
  high:      "Alta    (~320 kbps)",
  very_high: "Molto alta (Lossless)",
};

const STORAGE_KEY = "harmony_audio_settings";

function load(): AudioSettings {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return { ...defaults(), ...JSON.parse(s) };
  } catch (_) {}
  return defaults();
}

function defaults(): AudioSettings {
  return {
    streamingQuality: "high",
    downloadQuality: "high",
    crossfadeSec: 0,
    loudnessNorm: true,
    gaplessPlayback: true,
    monoAudio: false,
    hardwareAccel: true,
    autoplayEnabled: true,
    showUnplayable: false,
    syncLocalFiles: false,
  };
}

export default function AudioSettingsContent() {
  const [settings, setSettings] = useState<AudioSettings>(load);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const update = (patch: Partial<AudioSettings>) => setSettings(prev => ({ ...prev, ...patch }));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    toast({ title: "✓ Impostazioni salvate" });
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    const d = defaults();
    setSettings(d);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    toast({ title: "Impostazioni ripristinate" });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" /> Impostazioni Audio
          </h1>
          <p className="text-sm text-muted-foreground">Qualità, dissolvenza e preferenze di riproduzione</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors min-h-[44px]">
            <RotateCcw className="w-4 h-4" />
          </button>
          <motion.button onClick={save} whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${saved ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"}`}>
            <Save className="w-4 h-4" />{saved ? "Salvato!" : "Salva"}
          </motion.button>
        </div>
      </div>

      {/* Qualità streaming */}
      <Section icon={Wifi} title="Qualità streaming">
        <RadioGroup
          label="Quando in streaming"
          options={Object.entries(QUALITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          value={settings.streamingQuality}
          onChange={v => update({ streamingQuality: v as any })}
        />
      </Section>

      {/* Qualità download */}
      <Section icon={Download} title="Qualità download">
        <RadioGroup
          label="Quando si scarica per uso offline"
          options={Object.entries(QUALITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          value={settings.downloadQuality}
          onChange={v => update({ downloadQuality: v as any })}
        />
      </Section>

      {/* Dissolvenza (crossfade) */}
      <Section icon={Zap} title="Dissolvenza tra brani (Crossfade)">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Durata</span>
            <span className="font-semibold text-primary">{settings.crossfadeSec === 0 ? "Disattivata" : `${settings.crossfadeSec}s`}</span>
          </div>
          <input type="range" min={0} max={12} step={1} value={settings.crossfadeSec}
            onChange={e => update({ crossfadeSec: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(settings.crossfadeSec / 12) * 100}%, hsl(var(--secondary)) ${(settings.crossfadeSec / 12) * 100}%)` }}
          />
          <div className="flex justify-between text-xs text-muted-foreground/50">
            <span>Off</span>{[3,6,9].map(v => <span key={v}>{v}s</span>)}<span>12s</span>
          </div>
          <p className="text-xs text-muted-foreground">La dissolvenza incrociata sfuma la fine di un brano con l'inizio del successivo.</p>
        </div>
      </Section>

      {/* Toggle settings */}
      <Section icon={Music2} title="Riproduzione">
        {([
          { key: "loudnessNorm",  label: "Normalizzazione volume",    desc: "Mantiene il volume omogeneo tra i brani" },
          { key: "gaplessPlayback", label: "Riproduzione senza spazi", desc: "Elimina i silenzi tra i brani (es. album live)" },
          { key: "autoplayEnabled", label: "Autoplay",                desc: "Suggerisce brani simili quando la coda finisce" },
          { key: "showUnplayable", label: "Mostra brani non riproducibili", desc: "Mostra i brani nella libreria anche se non disponibili" },
        ] as { key: keyof AudioSettings; label: string; desc: string }[]).map(item => (
          <Toggle key={item.key} label={item.label} desc={item.desc}
            value={settings[item.key] as boolean}
            onChange={v => update({ [item.key]: v })} />
        ))}
      </Section>

      <Section icon={Volume2} title="Audio">
        {([
          { key: "monoAudio",     label: "Audio mono",       desc: "Combina canali stereo — utile per ascoltare con un solo auricolare" },
          { key: "hardwareAccel", label: "Accelerazione hardware", desc: "Usa la GPU per migliorare le prestazioni audio" },
        ] as { key: keyof AudioSettings; label: string; desc: string }[]).map(item => (
          <Toggle key={item.key} label={item.label} desc={item.desc}
            value={settings[item.key] as boolean}
            onChange={v => update({ [item.key]: v })} />
        ))}
      </Section>

    </div>
  );
}

// ── Micro-componenti ─────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: React.ComponentType<any>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
      <h2 className="font-semibold text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />{title}
      </h2>
      {children}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${value ? "bg-primary" : "bg-secondary"}`}>
        <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: value ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="space-y-1">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${value === opt.value ? "bg-primary/15 text-primary" : "hover:bg-background/40 text-muted-foreground"}`}>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${value === opt.value ? "border-primary" : "border-muted-foreground/40"}`}>
              {value === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
