import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Copy, Check, Radio, Signal, Smartphone,
  Music, Sparkles, RefreshCw, Zap, ShieldCheck, Share2, Volume2, Flame, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useListenAlong, NearbyUser } from "@/hooks/useListenAlong";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import GemOverlay from "@/components/GemOverlay";
import { useSessionContext } from "@/contexts/SessionContext";
import { useGemOverlay } from "@/hooks/useGemOverlay";

// Genera un userId anonimo persistente in sessionStorage
function getAnonUserId(): string {
  const key = "harmony_hub_anon_uid";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

const ANON_USER_ID = getAnonUserId();

// ── Floating Emoji Particle Canvas ──
function FloatingEmojiParticleCanvas({ reactions }: { reactions: any[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: "100vh", x: `${r.x}%`, scale: 0.5, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: "-10vh",
              x: [`${r.x}%`, `${r.x + (Math.random() * 20 - 10)}%`],
              scale: [0.5, 1.4, 1.2, 0.8],
              rotate: [0, Math.random() * 40 - 20, Math.random() * 40 - 20],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.2, ease: "easeOut" }}
            className="absolute text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Scanner Radar Spotify Jam ──
function RadarScanner({
  isRadarActive,
  isScanning,
  onRefresh,
}: {
  isRadarActive: boolean;
  isScanning: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
      {/* Cerchi concentrici animati */}
      <div className="absolute inset-0 rounded-full border border-primary/10" />
      <div className="absolute inset-8 rounded-full border border-primary/20" />
      <div className="absolute inset-20 rounded-full border border-primary/30" />
      <div className="absolute inset-32 rounded-full border border-primary/40" />

      {/* Pulsi radar */}
      {isRadarActive && (
        <>
          <motion.div
            animate={{ scale: [0.3, 1.1], opacity: [0.8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-primary/10 border border-primary/40"
          />
          <motion.div
            animate={{ scale: [0.3, 1.1], opacity: [0.8, 0] }}
            transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-primary/10 border border-primary/40"
          />
        </>
      )}

      {/* Raggio radar rotante */}
      {isRadarActive && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full origin-center pointer-events-none overflow-hidden"
        >
          <div
            className="w-1/2 h-1/2 bg-gradient-to-br from-primary/30 to-transparent"
            style={{
              clipPath: "polygon(100% 100%, 0 0, 100% 0)",
            }}
          />
        </motion.div>
      )}

      {/* Hub centrale */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRefresh}
        className="relative z-10 w-24 h-24 rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(59,130,246,0.3)] cursor-pointer group"
      >
        <Radio className={`w-8 h-8 text-primary ${isScanning ? "animate-spin" : "group-hover:scale-110 transition-transform"}`} />
        <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
          {isScanning ? "Scansione..." : "Radar Jam"}
        </span>
      </motion.div>
    </div>
  );
}

export default function ListenAlongContent() {
  const {
    listenAlongSessionId: sessionId,
    setListenAlongSessionId: setSessionId,
    isMultiDeviceSynced,
    activeDevicesCount,
  } = useSessionContext();

  const [joinId, setJoinId] = useState("");
  const {
    generateSessionId,
    isRadarActive,
    setIsRadarActive,
    nearbyUsers,
    isScanning,
    scanDone,
    refreshNearbyUsers,
  } = useListenAlong(sessionId);

  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Hook GEM Overlay per inviare e ricevere reazioni emoji
  const { reactions, sendReaction } = useGemOverlay({
    sessionId: sessionId || "global-radar-jam",
    userId: ANON_USER_ID,
  });

  const handleCreate = () => {
    const id = generateSessionId();
    setSessionId(id);
    toast({ title: "Jam Creata!", description: `Codice Sessione: ${id}` });
  };

  const handleJoin = (codeToJoin?: string) => {
    const targetCode = codeToJoin || joinId;
    if (targetCode && targetCode.length >= 4) {
      setSessionId(targetCode.toUpperCase());
      toast({
        title: "Sincronizzato alla Jam!",
        description: `Stanza: ${targetCode.toUpperCase()}`,
      });
    }
  };

  const copyToClipboard = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copiato!", description: "Codice sessione copiato negli appunti." });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative">
      {/* Particle Canvas Floating Emojis */}
      <FloatingEmojiParticleCanvas reactions={reactions} />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header con badge Multi-Device Sync */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/30 to-emerald-500/20 border border-primary/40 flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Spotify Jam & Listen Along</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest">
                  Live
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Rileva automaticamente amici nelle vicinanze o sincronizza l'ascolto su tutti i dispositivi.
              </p>
            </div>
          </div>

          {/* Device Sync Status Badge */}
          {isMultiDeviceSynced && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Sincronizzato su {activeDevicesCount} schede/dispositivi del tuo account</span>
            </motion.div>
          )}
        </div>

        {/* ── SEZIONE PRINCIPALE ── */}
        {!sessionId ? (
          <div className="space-y-8">
            {/* Cards Creazione / Unione Rapida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 md:p-8 space-y-6 border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/30 transition-all shadow-xl group">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Avvia una Nuova Jam</h2>
                  <p className="text-sm text-muted-foreground">
                    Crea una stanza di ascolto condivisa e trasmetti la tua musica in diretta.
                  </p>
                </div>
                <Button onClick={handleCreate} className="w-full gap-2 h-12 text-base font-semibold shadow-md">
                  <Plus className="w-5 h-5" /> Avvia Stanza Jam
                </Button>
              </Card>

              <Card className="p-6 md:p-8 space-y-6 border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/30 transition-all shadow-xl">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Unisciti con Codice</h2>
                  <p className="text-sm text-muted-foreground">
                    Inserisci il codice unico della Jam o scansiona il QR code inviato da un amico.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Es: MARCO-JAM"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    className="font-mono uppercase h-12 text-base tracking-wider"
                  />
                  <Button onClick={() => handleJoin()} variant="secondary" className="h-12 px-6 font-semibold">
                    Unisciti
                  </Button>
                </div>
              </Card>
            </div>

            {/* ── SCANNER RADAR UTENTI NELLE VICINANZE ── */}
            <Card className="p-6 md:p-8 border-primary/20 bg-card/40 backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Signal className="w-5 h-5 text-primary animate-pulse" />
                    <h2 className="text-xl font-bold">Utenti e Jam Nelle Vicinanze</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ricerca automatica attiva via Wi-Fi, Bluetooth e Supabase Presence.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant={isRadarActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsRadarActive(!isRadarActive)}
                    className="gap-2 text-xs"
                  >
                    <Radio className="w-4 h-4" />
                    {isRadarActive ? "Visibile sul Radar" : "Invisibile"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshNearbyUsers}
                    disabled={isScanning}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                    Aggiorna
                  </Button>
                </div>
              </div>

              {/* Layout Radar + Lista Risultati */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Radar */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
                  <RadarScanner
                    isRadarActive={isRadarActive}
                    isScanning={isScanning}
                    onRefresh={refreshNearbyUsers}
                  />
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    {isScanning
                      ? "Scansione dello spazio circostante..."
                      : "Tocca il centro del radar per aggiornare i dispositivi nelle vicinanze."}
                  </p>
                </div>

                {/* Lista Utenti Trovati */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                    <span>JAM TROVATE NELLE VICINANZE ({isScanning ? "..." : nearbyUsers.length})</span>
                    <span>AUTOMATICO</span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {/* Stato: scansione in corso */}
                    {isScanning && nearbyUsers.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                          <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDelay: '0.3s' }} />
                          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <Signal className="w-7 h-7 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Scansione in corso...</p>
                          <p className="text-xs text-muted-foreground mt-1">Ricerca utenti Harmony Hub nelle vicinanze</p>
                        </div>
                      </div>
                    )}

                    {/* Stato: scansione finita, nessun utente */}
                    {scanDone && nearbyUsers.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 border border-border/40 flex items-center justify-center">
                          <Users className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Nessun utente trovato</p>
                          <p className="text-xs text-muted-foreground mt-1">Nessun altro dispositivo Harmony Hub rilevato nelle vicinanze.</p>
                          <p className="text-xs text-muted-foreground">Premi <span className="font-semibold text-foreground">Aggiorna</span> per riprovare.</p>
                        </div>
                      </div>
                    )}

                    {/* Utenti reali trovati */}
                    {nearbyUsers.map((user) => {
                      const isRealLiveDevice = user.distance.includes("Supabase") || user.distance.includes("Live");
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                            isRealLiveDevice
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 shadow-md"
                              : "bg-secondary/30 hover:bg-secondary/60 border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-11 h-11 rounded-full object-cover border-2 border-primary/40 shadow-sm"
                              />
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                                {isRealLiveDevice && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-black uppercase tracking-wider">
                                    LIVE DEVICE
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                <Music className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">
                                  {user.currentTrack ? `${user.currentTrack} - ${user.artist}` : "In ascolto"}
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                                {user.distance}
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleJoin(user.jamCode)}
                            className="shrink-0 gap-1.5 text-xs font-semibold shadow-md"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Unisciti alla Jam
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* ── SCHERMATA SESSIONE JAM ATTIVA ── */
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="space-y-8"
            >
              <Card className="p-8 flex flex-col items-center text-center space-y-6 border-primary/30 bg-primary/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Stanza Jam in Diretta
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold tracking-tight">Sessione Jam Attiva</h2>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Gli altri partecipanti sincronizzeranno la riproduzione in tempo reale sul loro dispositivo.
                  </p>
                </div>

                {/* QR Code & Codice Copiabile */}
                <div className="flex flex-col items-center gap-5 bg-white p-6 rounded-3xl shadow-2xl border-4 border-primary/20">
                  <QRCodeSVG value={`musichub://join/${sessionId}`} size={190} />
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-secondary rounded-2xl font-mono text-2xl font-black text-black shadow-inner">
                    {sessionId}
                    <button
                      onClick={copyToClipboard}
                      className="text-muted-foreground hover:text-black transition-colors p-1"
                      aria-label="Copia codice"
                    >
                      {copied ? <Check className="w-6 h-6 text-emerald-600" /> : <Copy className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={copyToClipboard}
                    variant="secondary"
                    className="gap-2 text-xs font-semibold h-10 px-4"
                  >
                    <Share2 className="w-4 h-4" />
                    Condividi Invito
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSessionId(null)}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs font-semibold h-10 px-4"
                  >
                    Abbandona Sessione Jam
                  </Button>
                </div>
              </Card>

              {/* ── REAZIONI EMOJI VOLANTI (GEM OVERLAY) ── */}
              <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-xl flex flex-col items-center text-center space-y-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                    <Flame className="w-4 h-4" /> Reazioni in Tempo Reale
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tocca un'emoji per farla volare a schermo su tutti i dispositivi connessi alla Jam!
                  </p>
                </div>

                <GemOverlay sessionId={sessionId} sendReaction={sendReaction} />
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
