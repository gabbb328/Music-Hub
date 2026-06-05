import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, ExternalLink, Mail, User, ArrowLeft, Send, ShieldAlert } from "lucide-react";
import { redirectToSpotifyAuth } from "@/services/spotify-auth";
import { useAlexa } from "@/hooks/useAlexa";
import emailjs from "@emailjs/browser";
import { useToast } from "@/hooks/use-toast";
import { sendTelegramMessage } from "@/services/telegram-api";

export default function SpotifyLogin() {
  const isAlexa = useAlexa();
  const { toast } = useToast();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestUsername, setRequestUsername] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = () => {
    redirectToSpotifyAuth();
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestUsername.trim() || !requestEmail.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Messaggio nella inbox admin
      const MSGS_KEY = "admin_messages";
      let msgs = [];
      try { msgs = JSON.parse(localStorage.getItem(MSGS_KEY) ?? "[]"); } catch (e) {}
      msgs.unshift({
        id: Date.now().toString(),
        from: requestUsername,
        subject: "Nuova richiesta di accesso all'app",
        body: `L'utente "${requestUsername}" (${requestEmail}) vuole accedere all'app. Vai in Utenti & Permessi per aggiungerlo alla dashboard di Spotify.`,
        receivedAt: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem(MSGS_KEY, JSON.stringify(msgs));

      // Invia a Telegram direttamente
      await sendTelegramMessage(
        `🚨 <b>Nuova Richiesta di Accesso all'App!</b>\n\n` +
        `👤 <b>Utente:</b> ${requestUsername}\n` +
        `📧 <b>Email:</b> ${requestEmail}\n\n` +
        `<i>Aggiungi questo utente alla dashboard sviluppatori di Spotify.</i>`
      );

      const acceptLink = `${window.location.origin}/collab/approve?status=accepted&user=${encodeURIComponent(requestUsername)}`;
      const rejectLink = `${window.location.origin}/collab/approve?status=rejected&user=${encodeURIComponent(requestUsername)}`;

      await emailjs.send(
        "service_fu31pxb",
        "template_collab",
        {
          from_name: requestUsername,
          message: `Nuova richiesta di accesso da "${requestUsername}" (${requestEmail}) su Music Hub.\n\nPer approvare clicca qui:\n${acceptLink}\n\nPer rifiutare clicca qui:\n${rejectLink}`,
          to_name: "Admin",
          reply_to: requestEmail || "noreply@musichub.app",
        },
        "j3z-hU3f_1v_x-b1E",
      );

      toast({
        title: "✓ Richiesta inviata",
        description: "L'amministratore valuterà la tua richiesta di accesso.",
      });
      setShowRequestForm(false);
      setRequestUsername("");
      setRequestEmail("");
    } catch (err) {
      toast({
        title: "Richiesta registrata",
        description: "Salvata localmente, notifica email potrebbe non essere partita.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Alexa/Echo Show: layout semplificato, zero backdrop-blur, colori hardcoded ──
  if (isAlexa) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#080d1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            backgroundColor: "#0c1226",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <Headphones
            style={{
              width: 64,
              height: 64,
              color: "#3b82f6",
              margin: "0 auto 16px",
            }}
          />

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              marginBottom: "4px",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#3b82f6" }}>Music</span>Hub
          </h1>

          <p
            style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "32px" }}
          >
            Your personal music experience
          </p>

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              backgroundColor: "#1DB954",
              color: "white",
              fontWeight: 700,
              fontSize: "16px",
              padding: "18px 24px",
              borderRadius: "10px",
              border: "none",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Login with Spotify
          </button>

          <p style={{ color: "#475569", fontSize: "10px", marginTop: "20px" }}>
            Optimized for Alexa Echo Show
          </p>
        </div>
      </div>
    );
  }

  // ── Standard (browser normale) ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-background flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!showRequestForm ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="glass-surface border-2 border-primary/20 rounded-2xl">
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    className="inline-block"
                  >
                    <Headphones className="w-20 h-20 text-primary mx-auto" />
                  </motion.div>

                  <h1 className="text-4xl font-bold">
                    <span className="text-primary">Music</span>
                    <span className="text-foreground">Hub</span>
                  </h1>
                  <p className="text-muted-foreground">
                    Your personal music experience
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleLogin}
                    className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#1DB954]/20"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Login with Spotify
                  </button>

                  <p className="text-xs text-muted-foreground text-center">
                    Music Hub uses Spotify to provide you with personalized music
                    experience
                  </p>
                  
                  <div className="pt-4 mt-2 border-t border-border/50">
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="w-full py-3 px-4 rounded-xl border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      Richiedi accesso all'app
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      Se il tuo account Spotify non è abilitato all'uso di questa app
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    By logging in, you agree to Spotify's Terms of Service
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="request"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="glass-surface border-2 border-primary/20 rounded-2xl relative overflow-hidden">
              <button
                onClick={() => setShowRequestForm(false)}
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-secondary/50 text-muted-foreground transition-colors z-10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="p-8 pt-12 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <ShieldAlert className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Richiesta Accesso</h2>
                  <p className="text-sm text-muted-foreground">
                    Inserisci i tuoi dati Spotify per richiedere l'abilitazione
                  </p>
                </div>

                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">
                      Username / Nome su Spotify
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <input
                        type="text"
                        required
                        value={requestUsername}
                        onChange={(e) => setRequestUsername(e.target.value)}
                        placeholder="Il tuo nome utente"
                        className="w-full bg-background/50 border-2 border-border focus:border-primary rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">
                      Email collegata a Spotify
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <input
                        type="email"
                        required
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        placeholder="email@esempio.com"
                        className="w-full bg-background/50 border-2 border-border focus:border-primary rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !requestUsername.trim() || !requestEmail.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Invia Richiesta
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
