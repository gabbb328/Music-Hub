import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useListenAlong } from "@/hooks/useListenAlong";
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

export default function ListenAlongContent() {
  // ── Sessione condivisa globalmente (persiste tra navigazioni) ──
  const { listenAlongSessionId: sessionId, setListenAlongSessionId: setSessionId } =
    useSessionContext();
  const [joinId, setJoinId] = useState("");
  const { generateSessionId } = useListenAlong(sessionId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Hook GEM Overlay per inviare reazioni
  const { sendReaction } = useGemOverlay({ sessionId, userId: ANON_USER_ID });

  const handleCreate = () => {
    const id = generateSessionId();
    setSessionId(id);
    toast({ title: "Sessione Creata", description: `Codice: ${id}` });
  };

  const handleJoin = () => {
    if (joinId.length >= 6) {
      setSessionId(joinId.toUpperCase());
      toast({ title: "Sessione Unita", description: `Codice: ${joinId.toUpperCase()}` });
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
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Listen Along</h1>
            <p className="text-muted-foreground">Ascolta musica in sincronia con i tuoi amici.</p>
          </div>
        </div>

        {/* Setup sessione */}
        {!sessionId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 space-y-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-colors">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Crea una Sessione</h2>
                <p className="text-sm text-muted-foreground">Genera un codice per far unire i tuoi amici.</p>
              </div>
              <Button onClick={handleCreate} className="w-full gap-2 h-12 text-base">
                <Plus className="w-4 h-4" /> Crea Nuova Stanza
              </Button>
            </Card>

            <Card className="p-8 space-y-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-colors">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Unisciti a una Sessione</h2>
                <p className="text-sm text-muted-foreground">Inserisci il codice ricevuto dall'amico.</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Es: A4B8-9XX2"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="font-mono uppercase h-12"
                />
                <Button onClick={handleJoin} variant="secondary" className="h-12 px-5">
                  Unisci
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* ── Sessione attiva ── */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="space-y-8"
            >
              {/* Card info sessione */}
              <Card className="p-8 flex flex-col items-center text-center space-y-6 border-primary/30 bg-primary/5 backdrop-blur-md">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Sessione Attiva</h2>
                  <p className="text-muted-foreground text-sm">
                    Condividi questo codice o il QR code con i tuoi amici.
                  </p>
                </div>

                {/* QR + codice */}
                <div className="flex flex-col items-center gap-5 bg-white p-6 rounded-2xl shadow-md">
                  <QRCodeSVG value={`musichub://join/${sessionId}`} size={180} />
                  <div className="flex items-center gap-3 px-4 py-2 bg-secondary rounded-xl font-mono text-xl font-bold text-black">
                    {sessionId}
                    <button
                      onClick={copyToClipboard}
                      className="text-muted-foreground hover:text-black transition-colors"
                      aria-label="Copia codice"
                    >
                      {copied
                        ? <Check className="w-5 h-5 text-green-500" />
                        : <Copy className="w-5 h-5" />
                      }
                    </button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setSessionId(null)}
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                  Abbandona Sessione
                </Button>
              </Card>

              {/* ── GEM OVERLAY ── */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Reagisci in tempo reale — le emoji appariranno sulla copertina!
                </p>
                <GemOverlay
                  sessionId={sessionId}
                  sendReaction={sendReaction}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
