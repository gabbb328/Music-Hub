import { useState, useEffect, useCallback } from "react";
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
    <div className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] shrink-0 mx-auto aspect-square flex items-center justify-center">
      {/* Cerchi concentrici animati */}
      <div className="absolute inset-0 rounded-full border border-primary/10" />
      <div className="absolute inset-8 rounded-full border border-primary/20" />
      <div className="absolute inset-20 rounded-full border border-primary/30" />
      <div className="absolute inset-28 sm:inset-32 rounded-full border border-primary/40" />

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
        className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(59,130,246,0.3)] cursor-pointer group"
      >
        <Radio className={`w-7 h-7 sm:w-8 sm:h-8 text-primary ${isScanning ? "animate-spin" : "group-hover:scale-110 transition-transform"}`} />
        <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-primary uppercase">
          {isScanning ? "Scansione..." : "Radar Jam"}
        </span>
      </motion.div>
    </div>
  );
}

export default function ListenAlongContent() {
  const { toast } = useToast();
  const {
    listenAlongSessionId: sessionId,
    setListenAlongSessionId: setSessionId,
    isMultiDeviceSynced,
    activeDevicesCount,
  } = useSessionContext();

  const [jamMode, setJamMode] = useState<"control" | "simultaneous">("simultaneous");
  const [isHost, setIsHost] = useState<boolean>(false);
  const [joinId, setJoinId] = useState<string>("");
  const [incomingInvite, setIncomingInvite] = useState<NearbyUser | null>(null);

  // Notifica invito quando viene rilevata una nuova Jam nelle vicinanze da utente esterno
  const handleJamInvite = useCallback((user: NearbyUser) => {
    if (sessionId === user.jamCode) return;
    setIncomingInvite(user);
  }, [sessionId]);

  const {
    generateSessionId,
    isRadarActive,
    setIsRadarActive,
    nearbyUsers,
    isScanning,
    scanDone,
    refreshNearbyUsers,
  } = useListenAlong(sessionId, jamMode, handleJamInvite);

  const [copied, setCopied] = useState(false);

  // Hook GEM Overlay per inviare e ricevere reazioni emoji
  const { reactions, sendReaction } = useGemOverlay({
    sessionId: sessionId || "global-radar-jam",
    userId: ANON_USER_ID,
  });

  const handleCreate = (selectedMode: "control" | "simultaneous" = "simultaneous") => {
    const id = generateSessionId();
    setJamMode(selectedMode);
    setIsHost(true);
    setSessionId(id);
    // Nessun toast ridondante sul dispositivo Host che ha appena avviato la Jam
  };

  const handleJoin = (codeToJoin?: string) => {
    const targetCode = codeToJoin || joinId;
    if (targetCode && targetCode.length >= 4) {
      setIsHost(false);
      setSessionId(targetCode.toUpperCase());
      setIncomingInvite(null);
      toast({
        title: "Sincronizzato alla Jam!",
        description: `Stanza: ${targetCode.toUpperCase()}`,
        variant: "success",
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
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 sm:space-y-8 relative">
      {/* Particle Canvas Floating Emojis */}
      <FloatingEmojiParticleCanvas reactions={reactions} />

      {/* ── Banner Notifica Invito Jam (Con bottoni "Collegati" e "Annulla") ── */}
      <AnimatePresence>
        {incomingInvite && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className="p-4 sm:p-5 rounded-2xl bg-card/95 border-2 border-emerald-500/50 backdrop-blur-2xl shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={incomingInvite.avatar}
                  alt={incomingInvite.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shrink-0 shadow-md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {incomingInvite.name} ha avviato una Jam!
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Stanza: <span className="font-mono text-emerald-400 font-bold">{incomingInvite.jamCode}</span> • Tocca per sincronizzare la musica.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <Button
                  onClick={() => handleJoin(incomingInvite.jamCode)}
                  className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 h-9 shadow-md gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Collegati
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIncomingInvite(null)}
                  className="flex-1 sm:flex-initial text-xs font-semibold px-3.5 h-9 border-border text-muted-foreground hover:text-foreground"
                >
                  Annulla
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Header con badge Multi-Device Sync */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-primary/30 to-emerald-500/20 border border-primary/40 flex items-center justify-center shadow-lg shrink-0">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Spotify Jam & Listen Along</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest">
                  Live
                </span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Rileva automaticamente amici nelle vicinanze o sincronizza l'ascolto su tutti i dispositivi.
              </p>
            </div>
          </div>

          {/* Device Sync Status Badge */}
          {isMultiDeviceSynced && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-sm w-fit"
            >
              <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <span>Sincronizzato su {activeDevicesCount} schede/dispositivi del tuo account</span>
            </motion.div>
          )}
        </div>

        {/* ── SEZIONE PRINCIPALE ── */}
        {!sessionId ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Cards Creazione / Unione Rapida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-5 sm:p-6 md:p-8 space-y-5 border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/30 transition-all shadow-xl group flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold">Avvia una Nuova Jam (Host)</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Come Host, scegli se riprodurre contemporaneamente la musica o usarlo come telecomando remoto.
                  </p>
                </div>
                
                {/* Sezione Scelta Modalità Host */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Scegli Modalità di Riproduzione:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleCreate("simultaneous")}
                      className="w-full gap-2 min-h-[44px] h-auto py-2.5 px-3 text-xs leading-snug font-semibold shadow-md bg-primary hover:bg-primary/90 flex items-center justify-center text-center"
                    >
                      <Volume2 className="w-4 h-4 shrink-0" /> Contemporanea (Stereo Sync)
                    </Button>
                    <Button
                      onClick={() => handleCreate("control")}
                      variant="secondary"
                      className="w-full gap-2 min-h-[44px] h-auto py-2.5 px-3 text-xs leading-snug font-semibold shadow-md flex items-center justify-center text-center"
                    >
                      <Smartphone className="w-4 h-4 shrink-0" /> Controllo Remoto
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 md:p-8 space-y-5 border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/30 transition-all shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold">Unisciti con Codice</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Inserisci il codice unico della Jam o scansiona il QR code inviato da un amico.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Es: MARCO-JAM"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    className="font-mono uppercase h-11 sm:h-12 text-sm sm:text-base tracking-wider"
                  />
                  <Button onClick={() => handleJoin()} variant="secondary" className="h-11 sm:h-12 px-5 sm:px-6 font-semibold shrink-0 text-xs sm:text-sm">
                    Unisciti
                  </Button>
                </div>
              </Card>
            </div>

            {/* ── SCANNER RADAR UTENTI NELLE VICINANZE ── */}
            <Card className="p-5 sm:p-6 md:p-8 border-primary/20 bg-card/40 backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Signal className="w-5 h-5 text-primary animate-pulse shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold">Jam Attive Nelle Vicinanze</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mostra automaticamente solo gli utenti che hanno avviato una Jam live.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant={isRadarActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsRadarActive(!isRadarActive)}
                    className="gap-2 text-xs h-9"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    {isRadarActive ? "Visibile sul Radar" : "Invisibile"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshNearbyUsers}
                    disabled={isScanning}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                    Aggiorna
                  </Button>
                </div>
              </div>

              {/* Layout Radar + Lista Risultati */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                {/* Visual Radar */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-2 sm:p-4">
                  <RadarScanner
                    isRadarActive={isRadarActive}
                    isScanning={isScanning}
                    onRefresh={refreshNearbyUsers}
                  />
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    {isScanning
                      ? "Scansione in corso per Jam attive..."
                      : "Tocca il centro del radar per aggiornare la ricerca."}
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
                      <div className="flex flex-col items-center justify-center py-10 sm:py-12 gap-4 text-center">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                          <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDelay: '0.3s' }} />
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <Signal className="w-6 h-6 sm:w-7 sm:h-7 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Scansione in corso...</p>
                          <p className="text-xs text-muted-foreground mt-1">Ricerca Jam attive nelle vicinanze</p>
                        </div>
                      </div>
                    )}

                    {/* Stato: scansione finita, nessun utente */}
                    {scanDone && nearbyUsers.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 sm:py-12 gap-3 text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-secondary/50 border border-border/40 flex items-center justify-center">
                          <Users className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Nessuna Jam attiva trovata</p>
                          <p className="text-xs text-muted-foreground mt-1">La ricerca trova solo utenti che hanno già avviato una Jam.</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Premi <span className="font-semibold text-foreground">Aggiorna</span> per riprovare.</p>
                        </div>
                      </div>
                    )}

                    {/* Utenti reali trovati che ospitano una Jam */}
                    {nearbyUsers.map((user) => {
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className="p-3.5 sm:p-4 rounded-2xl border bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 shadow-md flex items-center justify-between gap-3 sm:gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-primary/40 shadow-sm"
                              />
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-xs sm:text-sm truncate">{user.name}</h3>
                                <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-500 text-black uppercase tracking-wider">
                                  JAM LIVE
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                <Music className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate text-[11px] sm:text-xs">
                                  {user.currentTrack ? `${user.currentTrack} - ${user.artist}` : "Jam in riproduzione"}
                                </span>
                              </div>
                              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-medium">
                                {user.distance}
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleJoin(user.jamCode)}
                            className="shrink-0 gap-1.5 text-xs font-semibold shadow-md bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-3"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Unisciti
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
              className="space-y-6 sm:space-y-8"
            >
              <Card className="p-5 sm:p-8 flex flex-col items-center text-center space-y-6 border-primary/30 bg-primary/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="self-center sm:absolute sm:top-4 sm:right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Stanza Jam in Diretta
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sessione Jam Attiva</h2>
                    {isHost ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        ⭐ HOST
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                        👥 PARTECIPANTE
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
                    Gli altri partecipanti sincronizzeranno la riproduzione in tempo reale sul loro dispositivo.
                  </p>
                </div>

                {/* Controllo Modalità Host (Solo Host può cambiare) */}
                <div className="w-full max-w-md p-4 rounded-2xl bg-card/80 border border-primary/20 space-y-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Modalità Riproduzione Jam
                    </span>
                    {isHost ? (
                      <span className="text-[10px] font-semibold text-emerald-400 shrink-0">Modificabile da te (Host)</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground shrink-0">🔒 Gestito dall'Host</span>
                    )}
                  </div>

                  {isHost ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={jamMode === "simultaneous" ? "default" : "outline"}
                        onClick={() => {
                          setJamMode("simultaneous");
                          toast({ title: "Modalità Aggiornata", description: "Riproduzione Contemporanea su tutti i dispositivi!" });
                        }}
                        className="gap-2 text-xs font-semibold h-10"
                      >
                        <Volume2 className="w-3.5 h-3.5 shrink-0" /> Contemporanea
                      </Button>
                      <Button
                        size="sm"
                        variant={jamMode === "control" ? "default" : "outline"}
                        onClick={() => {
                          setJamMode("control");
                          toast({ title: "Modalità Aggiornata", description: "Controllo Remoto (Telecomando) attivato!" });
                        }}
                        className="gap-2 text-xs font-semibold h-10"
                      >
                        <Smartphone className="w-3.5 h-3.5 shrink-0" /> Telecomando
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 text-xs font-medium">
                      {jamMode === "simultaneous" ? (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Riproduzione Contemporanea attiva</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 text-primary shrink-0" />
                          <span>Controllo Remoto attivo dall'Host</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* QR Code & Codice Copiabile */}
                <div className="w-full max-w-xs flex flex-col items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border-4 border-primary/20 mx-auto">
                  <QRCodeSVG value={`musichub://join/${sessionId}`} size={160} className="w-full max-w-[160px] sm:max-w-[190px] h-auto" />
                  <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2 bg-secondary rounded-2xl font-mono text-xl sm:text-2xl font-black text-black shadow-inner">
                    {sessionId}
                    <button
                      onClick={copyToClipboard}
                      className="text-muted-foreground hover:text-black transition-colors p-1"
                      aria-label="Copia codice"
                    >
                      {copied ? <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /> : <Copy className="w-5 h-5 sm:w-6 sm:h-6" />}
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
                    onClick={() => {
                      setSessionId(null);
                      setIsHost(false);
                    }}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs font-semibold h-10 px-4"
                  >
                    Abbandona Sessione Jam
                  </Button>
                </div>
              </Card>

              {/* ── REAZIONI EMOJI VOLANTI (GEM OVERLAY) ── */}
              <Card className="p-5 sm:p-6 border-border/40 bg-card/60 backdrop-blur-xl flex flex-col items-center text-center space-y-4 shadow-xl">
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

