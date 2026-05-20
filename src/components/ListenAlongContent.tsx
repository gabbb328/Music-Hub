import { useState } from "react";
import { Users, QrCode, Key, Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useListenAlong } from "@/hooks/useListenAlong";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

export default function ListenAlongContent() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState("");
  const { generateSessionId } = useListenAlong(sessionId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    const id = generateSessionId();
    setSessionId(id);
    toast({ title: "Sessione Creata", description: `Codice: ${id}` });
  };

  const handleJoin = () => {
    if (joinId.length >= 8) {
      setSessionId(joinId.toUpperCase());
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Listen Along</h1>
            <p className="text-muted-foreground">Ascolta musica in sincronia con i tuoi amici.</p>
          </div>
        </div>

        {!sessionId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 space-y-6 border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Crea una Sessione</h2>
                <p className="text-sm text-muted-foreground">Genera un codice per far unire i tuoi amici.</p>
              </div>
              <Button onClick={handleCreate} className="w-full gap-2 h-12 text-lg">
                <Plus className="w-4 h-4" /> Crea Nuova Stanza
              </Button>
            </Card>

            <Card className="p-8 space-y-6 border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Unisciti a una Sessione</h2>
                <p className="text-sm text-muted-foreground">Inserisci il codice a 8 cifre ricevuto.</p>
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Es: A4B8-9XX2" 
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  className="font-mono uppercase h-12" 
                />
                <Button onClick={handleJoin} variant="secondary" className="h-12 px-6">Unisci</Button>
              </div>
            </Card>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-10 flex flex-col items-center text-center space-y-8 border-primary/30 bg-primary/5">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Sessione Attiva</h2>
                <p className="text-muted-foreground">Condividi questo codice o il QR code con i tuoi amici.</p>
              </div>

              <div className="flex flex-col items-center gap-6 bg-white p-6 rounded-2xl">
                <QRCodeSVG value={`musichub://join/${sessionId}`} size={200} />
                <div className="flex items-center gap-3 px-4 py-2 bg-secondary rounded-lg font-mono text-xl font-bold text-black">
                  {sessionId}
                  <button onClick={copyToClipboard} className="text-muted-foreground hover:text-black">
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button variant="outline" onClick={() => setSessionId(null)} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                Abbandona Sessione
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
import { motion } from "framer-motion";
