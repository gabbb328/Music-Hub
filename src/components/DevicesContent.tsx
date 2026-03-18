import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Laptop, Smartphone, Speaker, Radio, Check, RefreshCw,
  Wifi, WifiOff, Bluetooth, Monitor, Tv, Volume2, ArrowRight,
  Headphones, Loader2, AlertCircle, Zap
} from "lucide-react";
import { useAvailableDevices, useTransferPlaybackMutation, usePlaybackState } from "@/hooks/useSpotify";
import { SpotifyDevice } from "@/types/spotify";
import { useToast } from "@/hooks/use-toast";

// ── Mappa modello → nome leggibile + icona + brand color ─────────────────────
function parseDeviceInfo(raw: string, type: string): { name: string; detail: string; color: string } {
  const r = raw.toLowerCase();

  // Samsung Galaxy Buds
  if (r.includes("galaxy buds") || r.includes("buds"))
    return { name: raw, detail: "Samsung Galaxy Buds", color: "#1428A0" };
  if (r.includes("airpods"))
    return { name: raw, detail: "Apple AirPods", color: "#555" };
  if (r.includes("bose"))
    return { name: raw, detail: "Bose", color: "#222" };
  if (r.includes("sony"))
    return { name: raw, detail: "Sony", color: "#000" };
  if (r.includes("jabra"))
    return { name: raw, detail: "Jabra", color: "#333" };
  if (r.includes("sennheiser"))
    return { name: raw, detail: "Sennheiser", color: "#090" };
  if (r.includes("jbl"))
    return { name: raw, detail: "JBL", color: "#F37020" };

  // Tipo dispositivo
  switch (type.toLowerCase()) {
    case "computer":   return { name: raw, detail: "Computer",   color: "#3b82f6" };
    case "smartphone": return { name: raw, detail: "Smartphone", color: "#8b5cf6" };
    case "speaker":    return { name: raw, detail: "Altoparlante",color: "#22c55e" };
    case "tv":         return { name: raw, detail: "TV",         color: "#f59e0b" };
    case "cast_video": return { name: raw, detail: "Chromecast", color: "#ea4335" };
    case "game_console":return { name: raw, detail: "Console",   color: "#00cea7" };
    default:           return { name: raw, detail: raw,          color: "#64748b" };
  }
}

function DeviceIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case "computer":    return <Laptop className="w-5 h-5" />;
    case "smartphone":  return <Smartphone className="w-5 h-5" />;
    case "speaker":     return <Speaker className="w-5 h-5" />;
    case "tv":
    case "cast_video":  return <Tv className="w-5 h-5" />;
    case "game_console":return <Monitor className="w-5 h-5" />;
    default:            return <Radio className="w-5 h-5" />;
  }
}

export default function DevicesContent() {
  const { data: devicesData, isLoading, refetch } = useAvailableDevices();
  const { data: pb } = usePlaybackState();
  const transferMutation = useTransferPlaybackMutation();
  const { toast } = useToast();
  const [transferring, setTransferring] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Auto-refresh ogni 8s
  useEffect(() => {
    intervalRef.current = setInterval(() => { refetch(); setLastRefresh(new Date()); }, 8000);
    return () => clearInterval(intervalRef.current);
  }, [refetch]);

  const devices: SpotifyDevice[] = devicesData?.devices || [];
  const activeDevice = devices.find(d => d.is_active);
  const inactiveDevices = devices.filter(d => !d.is_active);

  const handleTransfer = async (device: SpotifyDevice) => {
    setTransferring(device.id);
    try {
      await transferMutation.mutateAsync({ deviceId: device.id, play: pb?.is_playing ?? true });
      toast({ title: "✓ Riproduzione trasferita", description: `Ora su ${device.name}` });
    } catch {
      toast({ title: "Errore", description: "Impossibile trasferire la riproduzione", variant: "destructive" });
    } finally { setTransferring(null); }
  };

  const handleRefresh = () => { refetch(); setLastRefresh(new Date()); toast({ title: "Dispositivi aggiornati" }); };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="w-6 h-6 text-primary" /> Dispositivi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {devices.length > 0 ? `${devices.length} dispositivo${devices.length > 1 ? "i" : ""} trovato${devices.length > 1 ? "i" : ""}` : "Nessun dispositivo"}
            {" · "}
            <span className="text-xs">Aggiornato alle {lastRefresh.toLocaleTimeString()}</span>
          </p>
        </div>
        <button onClick={handleRefresh}
          className="p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading && devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Ricerca dispositivi…</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <WifiOff className="w-14 h-14 text-muted-foreground/25" />
          <h3 className="font-semibold">Nessun dispositivo trovato</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Apri Spotify su un altro dispositivo oppure inizia la riproduzione per vederlo qui.
          </p>
          <button onClick={handleRefresh}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            Riprova
          </button>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Dispositivo attivo */}
          {activeDevice && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">In riproduzione</p>
              <DeviceCard device={activeDevice} isActive onTransfer={() => {}} transferring={false} />
            </div>
          )}

          {/* Altri dispositivi */}
          {inactiveDevices.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                Disponibili
              </p>
              <div className="space-y-2">
                {inactiveDevices.map(device => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isActive={false}
                    onTransfer={() => handleTransfer(device)}
                    transferring={transferring === device.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggerimento */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Suggerimento</p>
        <p>Spotify Premium richiesto per trasferire la riproduzione. Assicurati che tutti i dispositivi siano connessi con lo stesso account.</p>
      </div>
    </div>
  );
}

// ── Singola card dispositivo ──────────────────────────────────────────────────
function DeviceCard({
  device, isActive, onTransfer, transferring
}: {
  device: SpotifyDevice; isActive: boolean; onTransfer: () => void; transferring: boolean;
}) {
  const info = parseDeviceInfo(device.name, device.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        isActive
          ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10"
          : "border-border/40 bg-card/60 hover:bg-card"
      }`}
    >
      {/* Icona */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
        style={!isActive ? { color: info.color } : {}}>
        <DeviceIcon type={device.type} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{device.name}</p>
          {isActive && (
            <span className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wide shrink-0">
              <Check className="w-3 h-3" />Attivo
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{info.detail}</p>
        {/* Volume bar */}
        <div className="flex items-center gap-2 mt-1.5">
          <Volume2 className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${device.volume_percent}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">{device.volume_percent}%</span>
        </div>
      </div>

      {/* Azione */}
      {!isActive && (
        <button
          onClick={onTransfer}
          disabled={transferring}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold transition-colors min-h-[44px] shrink-0 disabled:opacity-50"
        >
          {transferring
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><ArrowRight className="w-3.5 h-3.5" />Trasferisci</>
          }
        </button>
      )}
    </motion.div>
  );
}
