import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones, ExternalLink, Smartphone, AlertCircle,
  Volume2, Zap, Wind, Mic, Music2, CheckCircle2,
  ChevronRight, Settings, Bluetooth, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Modelli supportati ────────────────────────────────────────────────────────
const SAMSUNG_BUDS = [
  { model: "Galaxy Buds3 Pro",   eq: true,  anc: true,  audio360: true,  spatialAudio: true,  appUrl: "galaxywearable://", supported: true },
  { model: "Galaxy Buds3",       eq: true,  anc: true,  audio360: false, spatialAudio: false, appUrl: "galaxywearable://", supported: true },
  { model: "Galaxy Buds2 Pro",   eq: true,  anc: true,  audio360: true,  spatialAudio: true,  appUrl: "galaxywearable://", supported: true },
  { model: "Galaxy Buds2",       eq: true,  anc: true,  audio360: false, spatialAudio: false, appUrl: "galaxywearable://", supported: true },
  { model: "Galaxy Buds Live",   eq: true,  anc: true,  audio360: false, spatialAudio: false, appUrl: "galaxywearable://", supported: true },
  { model: "Galaxy Buds Pro",    eq: true,  anc: true,  audio360: true,  spatialAudio: false, appUrl: "galaxywearable://", supported: true },
  { model: "Galaxy Buds+",       eq: false, anc: false, audio360: false, spatialAudio: false, appUrl: "galaxywearable://", supported: true },
  { model: "Galaxy Buds (2019)", eq: false, anc: false, audio360: false, spatialAudio: false, appUrl: "galaxywearable://", supported: true },
];

const EQ_PRESETS = [
  { name: "Normal",       gains: [0, 0, 0, 0, 0] },
  { name: "Bass Boost",   gains: [3, 2, 0, 0, 0] },
  { name: "Soft",         gains: [-1, -1, 0, 1, 1] },
  { name: "Dynamic",      gains: [1, 0, 0, 0, 1] },
  { name: "Clear",        gains: [0, 0, 0, 2, 3] },
  { name: "Treble Boost", gains: [0, 0, 0, 2, 4] },
];

const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
const IS_ANDROID = /Android/i.test(navigator.userAgent);
const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function SamsungBudsContent() {
  const [selectedModel, setSelectedModel] = useState<typeof SAMSUNG_BUDS[0] | null>(null);
  const [ancMode, setAncMode] = useState<"off" | "anc" | "ambient">("off");
  const [activeEqPreset, setActiveEqPreset] = useState("Normal");
  const [customEq, setCustomEq] = useState([0, 0, 0, 0, 0]);
  const [audio360, setAudio360] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const { toast } = useToast();

  const applySimulated = (key: string, value: string) => {
    toast({ title: `⚙ ${key}`, description: `Impostato: ${value} — Per applicare usa Galaxy Wearable` });
  };

  const openGalaxyWearable = () => {
    if (IS_ANDROID) {
      window.location.href = "galaxywearable://";
      setTimeout(() => {
        window.location.href = "https://play.google.com/store/apps/details?id=com.samsung.accessory";
      }, 1500);
    } else if (IS_IOS) {
      window.location.href = "https://apps.apple.com/it/app/galaxy-wearable-watch-manager/id1113456516";
    } else {
      toast({ title: "Galaxy Wearable", description: "Disponibile solo su dispositivi mobili", variant: "destructive" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-xl mx-auto w-full">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-xl">
          <Headphones className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Samsung Galaxy Buds</h1>
        <p className="text-sm text-muted-foreground">Controlla le impostazioni delle tue cuffie</p>
      </div>

      {/* Avviso web */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Le cuffie Samsung si controllano via Bluetooth LE. Su browser non è possibile una connessione diretta — le impostazioni si salvano qui, ma per applicarle usa <strong className="text-foreground">Galaxy Wearable</strong>.
          {IS_MOBILE && <> Premi il pulsante in basso per aprire l'app.</>}
        </p>
      </div>

      {/* Selezione modello */}
      <div>
        <button onClick={() => setShowModelPicker(v => !v)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors">
          <div className="flex items-center gap-3">
            <Bluetooth className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-sm">{selectedModel?.model ?? "Seleziona modello"}</p>
              <p className="text-xs text-muted-foreground">{selectedModel ? "Modello selezionato" : "Tocca per scegliere"}</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showModelPicker ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence>
          {showModelPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="pt-2 space-y-1">
                {SAMSUNG_BUDS.map(m => (
                  <button key={m.model}
                    onClick={() => { setSelectedModel(m); setShowModelPicker(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${selectedModel?.model === m.model ? "bg-primary/15 text-primary" : "hover:bg-secondary/50"}`}>
                    <span className="font-medium">{m.model}</span>
                    <div className="flex items-center gap-1.5">
                      {m.anc && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">ANC</span>}
                      {m.audio360 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-semibold">360°</span>}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Se non è Samsung o non compatibile */}
      {!selectedModel && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/40 border border-border/20">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Cuffie non Samsung?</p>
              <p>Questa pagina supporta solo Galaxy Buds. Per altre cuffie usa l'app del produttore. Funzionalità disponibili variano per modello.</p>
            </div>
          </div>
        </div>
      )}

      {/* Controlli — visibili solo se modello selezionato */}
      {selectedModel && (
        <div className="space-y-4">

          {/* Funzionalità del modello */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "ANC",         ok: selectedModel.anc,         icon: Wind },
              { label: "EQ",          ok: selectedModel.eq,          icon: Music2 },
              { label: "Audio 360°",  ok: selectedModel.audio360,    icon: Volume2 },
              { label: "Spatial Audio",ok: selectedModel.spatialAudio, icon: Zap },
            ].map(({ label, ok, icon: Icon }) => (
              <div key={label} className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium ${ok ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-secondary/30 text-muted-foreground/50 border border-border/20"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {ok ? <CheckCircle2 className="w-3.5 h-3.5 ml-auto" /> : <span className="ml-auto text-[10px]">N/D</span>}
              </div>
            ))}
          </div>

          {/* ANC */}
          {selectedModel.anc && (
            <div className="p-4 rounded-2xl bg-secondary/40 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Wind className="w-4 h-4 text-primary" />Riduzione rumore</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "off", label: "Spento" },
                  { id: "anc", label: "ANC" },
                  { id: "ambient", label: "Ambiente" },
                ] as const).map(opt => (
                  <button key={opt.id}
                    onClick={() => { setAncMode(opt.id); applySimulated("ANC", opt.label); }}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${ancMode === opt.id ? "bg-primary text-primary-foreground" : "bg-background/40 text-muted-foreground hover:text-foreground"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EQ */}
          {selectedModel.eq && (
            <div className="p-4 rounded-2xl bg-secondary/40 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Music2 className="w-4 h-4 text-primary" />Equalizzatore</p>
              <div className="grid grid-cols-3 gap-2">
                {EQ_PRESETS.map(p => (
                  <button key={p.name}
                    onClick={() => { setActiveEqPreset(p.name); setCustomEq(p.gains); applySimulated("EQ", p.name); }}
                    className={`py-2 rounded-xl text-xs font-medium transition-colors ${activeEqPreset === p.name ? "bg-primary text-primary-foreground" : "bg-background/40 text-muted-foreground hover:text-foreground"}`}>
                    {p.name}
                  </button>
                ))}
              </div>
              {/* Mini visualizzazione bande */}
              <div className="flex items-end justify-center gap-1 h-10 px-4">
                {["60Hz","250Hz","1kHz","4kHz","12kHz"].map((band, i) => (
                  <div key={band} className="flex flex-col items-center gap-0.5 flex-1">
                    <div className="flex-1 w-full flex flex-col justify-end items-center">
                      <div className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max(10, ((customEq[i] + 4) / 8) * 100)}%`,
                          background: `hsl(${200 + i * 30},80%,55%)`,
                          opacity: 0.8
                        }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 leading-none">{band}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio 360° */}
          {selectedModel.audio360 && (
            <div className="p-4 rounded-2xl bg-secondary/40 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Audio 360° Spatial</p>
                <p className="text-xs text-muted-foreground mt-0.5">Audio spaziale con tracciamento testa</p>
              </div>
              <button onClick={() => { setAudio360(v => !v); applySimulated("Audio 360°", !audio360 ? "ON" : "OFF"); }}
                className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${audio360 ? "bg-primary" : "bg-secondary"}`}>
                <motion.div className="w-5 h-5 rounded-full bg-white shadow" animate={{ x: audio360 ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }} />
              </button>
            </div>
          )}

          {/* Apri Galaxy Wearable */}
          <button onClick={openGalaxyWearable}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/15 hover:bg-primary/25 border border-primary/20 transition-colors min-h-[56px]">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-semibold text-sm text-primary">Apri Galaxy Wearable</p>
                <p className="text-xs text-muted-foreground">Per applicare tutte le impostazioni</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-primary" />
          </button>
        </div>
      )}
    </div>
  );
}
