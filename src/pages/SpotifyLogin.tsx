import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  ExternalLink,
  Mail,
  User,
  ArrowLeft,
  Send,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { redirectToSpotifyAuth } from "@/services/spotify-auth";
import {
  MusicProviderId,
  MUSIC_PROVIDERS,
  PROVIDER_LIST,
  setActiveProvider,
} from "@/services/music-providers";
import { MusicServiceLogo } from "@/components/MusicServiceLogos";
import { useAlexa } from "@/hooks/useAlexa";
import emailjs from "@emailjs/browser";
import { useToast } from "@/hooks/use-toast";
import { sendTelegramMessage } from "@/services/telegram-api";
import { gooeyToast } from "goey-toast";

export default function SpotifyLogin() {
  const isAlexa = useAlexa();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form Richiesta Accesso / Whitelist
  const [requestProvider, setRequestProvider] = useState<MusicProviderId>("spotify");
  const [requestUsername, setRequestUsername] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestAccountType, setRequestAccountType] = useState("premium");
  const [requestNotes, setRequestNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSpotifyLogin = () => {
    localStorage.setItem("harmony_music_provider", "spotify");
    redirectToSpotifyAuth();
  };

  const handleProviderLogin = async (providerId: MusicProviderId) => {
    setShowDropdown(false);

    if (providerId === "spotify") {
      handleSpotifyLogin();
      return;
    }

    const meta = MUSIC_PROVIDERS[providerId];
    const toastId = gooeyToast.info(`Connessione a ${meta.name}`, {
      description: `⏳ Accesso a ${meta.name}...\n⏳ Caricamento catalogo (${meta.badgeText})...`,
      duration: 5000,
    });

    await new Promise((r) => setTimeout(r, 600));

    setActiveProvider(providerId, {
      name: `${meta.shortName} User`,
      email: `user@${providerId}.app`,
      tier: meta.defaultTier,
    });

    gooeyToast.update(toastId, {
      title: `Connesso a ${meta.name}`,
      description: `✓ Account collegato con successo\n✓ Audio Engine pronto`,
      type: "success",
    });

    await new Promise((r) => setTimeout(r, 500));
    gooeyToast.dismiss(toastId);
    gooeyToast.success("Accesso completato", {
      description: `Benvenuto su Music Hub (${meta.name})!`,
    });

    navigate("/");
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestUsername.trim() || !requestEmail.trim()) return;

    setIsSubmitting(true);
    const targetMeta = MUSIC_PROVIDERS[requestProvider];

    try {
      const MSGS_KEY = "admin_messages";
      let msgs = [];
      try { msgs = JSON.parse(localStorage.getItem(MSGS_KEY) ?? "[]"); } catch (e) {}
      msgs.unshift({
        id: Date.now().toString(),
        from: requestUsername,
        provider: requestProvider,
        subject: `Nuova richiesta di accesso per ${targetMeta.name} (${requestAccountType.toUpperCase()})`,
        body: `L'utente "${requestUsername}" (${requestEmail}) con account ${targetMeta.name} (${requestAccountType.toUpperCase()}) richiede l'abilitazione all'app.\nProvider: ${targetMeta.name}\nNote: ${requestNotes || "Nessuna nota"}\nIstruzioni: ${targetMeta.whitelistInstruction}`,
        receivedAt: new Date().toISOString(),
        read: false,
        accountType: requestAccountType,
      });
      localStorage.setItem(MSGS_KEY, JSON.stringify(msgs));

      await sendTelegramMessage(
        `🚨 <b>Nuova Richiesta di Accesso all'App!</b>\n\n` +
        `🎵 <b>Servizio:</b> ${targetMeta.name} (${targetMeta.badgeText})\n` +
        `👤 <b>Utente:</b> ${requestUsername}\n` +
        `📧 <b>Email:</b> ${requestEmail}\n` +
        `💎 <b>Piano:</b> ${requestAccountType.toUpperCase()}\n` +
        (requestNotes ? `📝 <b>Note:</b> ${requestNotes}\n\n` : `\n`) +
        `<i>Istruzioni: ${targetMeta.whitelistInstruction}</i>`
      );

      const acceptLink = `${window.location.origin}/collab/approve?status=accepted&user=${encodeURIComponent(requestUsername)}`;
      const rejectLink = `${window.location.origin}/collab/approve?status=rejected&user=${encodeURIComponent(requestUsername)}`;

      await emailjs.send(
        "service_fu31pxb",
        "template_collab",
        {
          from_name: requestUsername,
          message: `Nuova richiesta di accesso per ${targetMeta.name} da "${requestUsername}" (${requestEmail}) su Music Hub.\n\nPer approvare clicca qui:\n${acceptLink}\n\nPer rifiutare clicca qui:\n${rejectLink}`,
          to_name: "Admin",
          reply_to: requestEmail || "noreply@musichub.app",
        },
        "j3z-hU3f_1v_x-b1E",
      );

      toast({
        title: "✓ Richiesta inviata",
        description: `L'amministratore valuterà la tua richiesta di accesso per ${targetMeta.name}.`,
      });
      setShowRequestForm(false);
      setRequestUsername("");
      setRequestEmail("");
      setRequestNotes("");
    } catch (err) {
      toast({
        title: "Richiesta registrata",
        description: "Salvata localmente, notifica inviata all'amministratore.",
      });
      setShowRequestForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Layout Alexa / Echo Show ──────────────────────────────────────────────
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
            onClick={handleSpotifyLogin}
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
              marginBottom: "16px",
            }}
          >
            Login with Spotify
          </button>

          <div style={{ textAlign: "left" }}>
            <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
              Oppure accedi con un altro servizio:
            </label>
            <select
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value as MusicProviderId;
                if (val) handleProviderLogin(val);
              }}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#1e293b",
                color: "white",
                border: "1px solid #334155",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              <option value="" disabled>Seleziona servizio...</option>
              {PROVIDER_LIST.filter((p) => p.id !== "spotify").map((p) => (
                <option key={p.id} value={p.id}>
                  Accedi con {p.name}
                </option>
              ))}
            </select>
          </div>

          <p style={{ color: "#475569", fontSize: "10px", marginTop: "20px" }}>
            Optimized for Alexa Echo Show
          </p>
        </div>
      </div>
    );
  }

  // ── Layout Standard Web & Mobile ──────────────────────────────────────────
  const otherServices = PROVIDER_LIST.filter((p) => p.id !== "spotify");

  return (
    <div className="theme-glass relative min-h-screen overflow-hidden bg-[#0d1117] flex items-center justify-center p-4 text-foreground">
      <div className="glass-blob glass-blob-1" />
      <div className="glass-blob glass-blob-2" />
      <div className="glass-blob glass-blob-3" />

      <AnimatePresence mode="wait">
        {!showRequestForm ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="glass-surface border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/30">
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
                  {/* ── 1. BOTTONE SPOTIFY COME PRIMA (PRIMARIO) ── */}
                  <button
                    onClick={handleSpotifyLogin}
                    className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#1DB954]/20"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Login with Spotify
                  </button>

                  <p className="text-xs text-muted-foreground text-center">
                    Music Hub uses Spotify to provide you with personalized music experience
                  </p>

                  {/* ── 2. MENU A TENDINA CON ALTRI BOTTONI (CLICK IMMEDIATO) ── */}
                  <div className="relative pt-1" style={{ display: "none" }}>       {/*da cancellare con l'uscita della versione 3.0*/}
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold transition-all flex items-center justify-between text-white shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-primary font-bold text-base">▾</span>
                        <span>Accedi con un altro servizio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {otherServices.length} servizi
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            showDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Tendina aperta: cliccando su un servizio fa login diretto */}
                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-2 z-30 p-2 rounded-2xl bg-[#0f172a] border border-white/15 shadow-2xl backdrop-blur-2xl max-h-72 overflow-y-auto space-y-1.5"
                        >
                          <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Scegli il servizio e accedi subito
                          </div>

                          {otherServices.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleProviderLogin(p.id)}
                              className="w-full p-3 rounded-xl flex items-center justify-between text-left transition-all hover:bg-white/10 group border border-transparent hover:border-white/10"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
                                  style={{ backgroundColor: p.brandColor }}
                                >
                                  <MusicServiceLogo provider={p.id} size={18} />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                                    Accedi con {p.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {p.tagline}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground font-medium shrink-0">
                                {p.badgeText}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── 3. RICHESTA ACCESSO ALL'APP / WHITELIST ── */}
                  <div className="pt-4 mt-2 border-t border-border/50">
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="w-full py-3 px-4 rounded-xl border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      Richiedi accesso all'app
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      Se il tuo account Spotify o di un altro servizio non è abilitato all'uso di questa app
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    By logging in, you agree to the Terms of Service
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── FORM RICHIESTA ACCESSO & WHITELIST ── */
          <motion.div
            key="request"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="glass-surface border-2 border-white/10 rounded-2xl relative overflow-hidden shadow-2xl shadow-black/30">
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
                    Inserisci i tuoi dati per richiedere l'abilitazione dell'account
                  </p>
                </div>

                <form onSubmit={handleRequestAccess} className="space-y-4">
                  {/* Selettore del servizio */}
                  {/*
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">
                      Servizio musicale
                    </label>
                    <select
                      value={requestProvider}
                      onChange={(e) => setRequestProvider(e.target.value as MusicProviderId)}
                      className="w-full bg-background/50 border-2 border-border focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition-all text-white"
                    >
                      {PROVIDER_LIST.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#0f172a] text-white">
                          {p.name} ({p.badgeText})
                        </option>
                      ))}
                    </select>
                  </div>
                  */} {/*da cancellare con l'uscita della versione 3.0*/}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">
                      Username / Nome utente
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
                      Email collegata al servizio
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

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">
                      Tipo di account
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRequestAccountType("premium")}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          requestAccountType === "premium"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/50 text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        Premium
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestAccountType("free")}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          requestAccountType === "free"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/50 text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        Free
                      </button>
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
