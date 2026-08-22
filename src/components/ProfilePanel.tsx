import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  LogOut,
  ArrowLeft,
  Github,
  Clock3,
  Shield,
  Eye,
  EyeOff,
  MessageSquare,
  Settings2,
  Sparkles,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlaybackState, useUserProfile } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { APP_VERSION, APP_BUILD } from "@/hooks/version";
import { clearToken } from "@/services/spotify-auth";
import {
  getCollabUsers,
  getAdminFeedbacks,
  saveAdminFeedbacks,
  isSupabaseConfigured,
  getGlobalSettings,
  saveCollabUsers,
} from "@/services/supabase-api";
import { saveTelegramChatId, removeTelegramChatId } from "@/services/telegram-api";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const Dot = ({ active, color = "#10b981" }: { active: boolean; color?: string }) => (
  <span
    className="inline-block w-1.5 h-1.5 rounded-full transition-all duration-300"
    style={{ backgroundColor: active ? color : "rgba(255,255,255,0.15)", boxShadow: active ? `0 0 5px ${color}` : "none" }}
  />
);

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useAccountTier } from "@/hooks/useAccountTier";

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();
  const { data: playbackState } = usePlaybackState();
  const { isPremium, isFree, simulatedTier, setSimulatedTier } = useAccountTier();
  const navigate = useNavigate();

  const [showCollabPage, setShowCollabPage] = useState(false);
  const [showFeedbackPage, setShowFeedbackPage] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Migliorie");
  const [feedbackText, setFeedbackText] = useState("");
  const [collabUser, setCollabUser] = useState<any>(null);
  const [showCollabPassword, setShowCollabPassword] = useState(false);
  const [tempChatId, setTempChatId] = useState("");
  const [isSuper, setIsSuper] = useState(false);

  const userName = (userProfile as any)?.display_name || "Utente Spotify";
  const userAvatar = (userProfile as any)?.images?.[0]?.url || null;
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const checkSuper = async () => {
      const hash = await sha256hex(userName.trim());
      const raw = import.meta.env.VITE_ADMIN_CREDENTIALS ?? "";
      if (raw) {
        const pairs = raw.split(",").map((p: string) => p.split(":")[0]?.trim());
        if (pairs.includes(hash)) setIsSuper(true);
      }
    };
    checkSuper();
  }, [userName]);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const users = await getCollabUsers();
      if (!mounted) return;
      const me = users.find((u: any) => u.name.toLowerCase() === userName.toLowerCase() && u.id !== "system_settings");
      setCollabUser(me || null);
    };
    fetchUser();
    const interval = setInterval(fetchUser, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, [userName]);

  const handleLogout = () => { clearToken(); navigate("/login"); onClose(); };

  const handleSaveChatId = async () => {
    if (!tempChatId.trim() || !collabUser) return;
    const ok = await saveTelegramChatId(collabUser.id, tempChatId.trim());
    if (ok) { toast({ title: "Telegram Collegato" }); setCollabUser({ ...collabUser, telegramChatId: tempChatId.trim(), telegramEnabled: true }); setTempChatId(""); }
    else toast({ title: "Errore", variant: "destructive" });
  };

  const handleRemoveChatId = async () => {
    if (!collabUser) return;
    const ok = await removeTelegramChatId(collabUser.id);
    if (ok) { toast({ title: "Telegram Scollegato" }); setCollabUser({ ...collabUser, telegramChatId: undefined }); }
    else toast({ title: "Errore", variant: "destructive" });
  };

  const sendCollabRequest = async () => {
    try {
      const globalSettings = await getGlobalSettings();
      const maxRequests = globalSettings?.maxRequestsPerSession ?? 2;
      const sessionCount = parseInt(sessionStorage.getItem("collab_requests_sent") || "0", 10);
      if (sessionCount >= maxRequests) { toast({ title: "Limite Raggiunto", variant: "destructive" }); return; }
      const existingUsers = await getCollabUsers();
      let me = existingUsers.find((u: any) => u.name === userName);
      if (!me) { me = { id: Date.now().toString(), name: userName, status: "pending", requestedAt: new Date().toISOString() }; existingUsers.push(me); }
      else { me.status = "pending"; me.requestedAt = new Date().toISOString(); }
      await saveCollabUsers(existingUsers);
      sessionStorage.setItem("collab_requests_sent", String(sessionCount + 1));
      toast({ title: "Richiesta Inviata" });
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      const existing = await getAdminFeedbacks();
      existing.unshift({ id: Date.now().toString(), userName, type: feedbackType, message: feedbackText, submittedAt: new Date().toISOString(), read: false });
      await saveAdminFeedbacks(existing);
      toast({ title: "Feedback inviato" });
      setFeedbackText(""); setShowFeedbackPage(false);
    } catch { toast({ title: "Errore", variant: "destructive" }); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-background border-l border-border z-[100] flex flex-col shadow-2xl"
          >
            {/* Hero header */}
            <div className="relative shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/8 to-transparent" />
              <div className="relative px-6 pt-6 pb-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {userAvatar ? (
                        <img src={userAvatar} alt={userName} className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/50 shadow-xl" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shadow-xl ring-2 ring-primary/30">
                          <span className="text-2xl font-black text-primary-foreground">{userInitial}</span>
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">
                        Ciao, <span className="text-primary">{userName.split(" ")[0]}</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Bentornato su Music Hub</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/60 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="wait">
                {showFeedbackPage ? (
                  <motion.div key="feedback" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowFeedbackPage(false)} className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                      <h2 className="text-lg font-bold">Invia Feedback</h2>
                    </div>
                    <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-4 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Categoria</label>
                        <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
                          <option value="Migliorie">Migliorie</option>
                          <option value="Fix bug">Fix bug</option>
                          <option value="Aggiunte">Aggiunte</option>
                          <option value="Varie">Varie</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-2 block">Messaggio (Max 2000 car.)</label>
                        <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value.slice(0, 2000))} placeholder="Scrivi qui il tuo feedback..." className="w-full h-32 bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors" />
                        <div className="text-right text-[10px] text-muted-foreground mt-1">{feedbackText.length}/2000</div>
                      </div>
                    </div>
                    <button onClick={handleSendFeedback} disabled={!feedbackText.trim()} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">Invia</button>
                  </motion.div>

                ) : showCollabPage ? (
                  <motion.div key="collab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowCollabPage(false)} className="p-2 rounded-xl hover:bg-secondary/60 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                      <h2 className="text-lg font-bold">Impostazioni Collaboratore</h2>
                    </div>
                    <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-4 space-y-3">
                      {collabUser?.status === "accepted" ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-green-600 text-white rounded-xl"><CheckCircle2 className="w-5 h-5 shrink-0" /><span className="text-xs font-semibold">Collaborazione Attiva</span></div>
                          {collabUser.permissions?.canAccessGithub && (
                            <button onClick={() => window.open("https://github.com/gabbb328/Music-Hub", "_blank")} className="w-full py-3 rounded-xl bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-700 flex items-center justify-center gap-2">
                              <Github className="w-4 h-4" />Apri GitHub del sito
                            </button>
                          )}
                          {collabUser.permissions?.canAccessAdmin && (
                            <button onClick={() => window.open(`${window.location.origin}/admin`)} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 flex items-center justify-center gap-2">
                              <Shield className="w-4 h-4" />Accedi alla Dashboard Admin
                            </button>
                          )}
                          {collabUser.credentials?.password && (
                            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Credenziali Admin</p>
                              {collabUser.credentials.username && <p className="text-sm font-mono bg-background/50 p-2 rounded-lg border border-border select-all">{collabUser.credentials.username}</p>}
                              <div className="relative flex items-center">
                                <p className="w-full text-sm font-mono bg-background/50 p-2 pr-10 rounded-lg border border-border select-all">{showCollabPassword ? collabUser.credentials.password : "••••••••"}</p>
                                <button onClick={() => setShowCollabPassword(!showCollabPassword)} className="absolute right-2 p-1.5 rounded-md hover:bg-secondary/80 text-muted-foreground" type="button">
                                  {showCollabPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                          {collabUser.telegramEnabled && (
                            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3 text-left">
                              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <span style={{ color: "#2CA5E0" }}>✈️</span>Notifiche Telegram
                              </p>
                              {!collabUser.telegramChatId ? (
                                <div className="space-y-3">
                                  <p className="text-xs text-muted-foreground">
                                    Inserisci il tuo Chat ID per ricevere aggiornamenti.
                                  </p>
                                  <input
                                    type="text"
                                    placeholder="Inserisci Telegram Chat ID"
                                    value={tempChatId}
                                    onChange={(e) => setTempChatId(e.target.value.replace(/\D/g, ""))}
                                    className="w-full bg-background border border-border focus:border-[#2CA5E0] rounded-xl py-2 px-3 text-sm outline-none transition-all"
                                  />
                                  <button
                                    onClick={handleSaveChatId}
                                    disabled={!tempChatId.trim()}
                                    style={{ backgroundColor: "#2CA5E0" }}
                                    className="w-full py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-95 transition-opacity disabled:opacity-40"
                                  >
                                    Collega account
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                                      <span className="text-xs font-semibold text-green-300">Telegram collegato</span>
                                    </div>
                                    <button onClick={handleRemoveChatId} className="text-[10px] text-red-400 hover:text-red-300 underline font-medium">
                                      Scollega
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => window.open("https://t.me/Music_hub64_bot", "_blank", "noopener,noreferrer")}
                                    style={{ backgroundColor: "#2CA5E0" }}
                                    className="w-full py-2.5 rounded-xl text-white font-semibold text-xs hover:opacity-95 transition-opacity"
                                  >
                                    Apri Chat Bot
                                  </button>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    Chat ID: {collabUser.telegramChatId}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {(isSuper || collabUser.permissions?.canModifySettings) && (
                            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">I Tuoi Permessi Attivi</p>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                                {[["canViewStats","Statistiche"],["canViewToken","Token"],["canAccessGithub","GitHub"],["canAccessAdmin","Admin"],["canAccessInfrastructure","Infrastruttura"],["canModifySettings","Impostazioni"],["canModifyGlobalSettings","Impost. Globali"]].map(([key, label]) => (
                                  <div key={key} className="flex items-center gap-1.5"><Dot active={!!collabUser.permissions?.[key]} /><span>{label}</span></div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <p className="text-sm text-muted-foreground mb-4">Invia la richiesta per collaborare.</p>
                          <button onClick={sendCollabRequest} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90">Collabora</button>
                        </div>
                      )}
                    </div>
                  </motion.div>

                ) : (
                  <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* Info Spotify */}
                    <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><Info className="w-4 h-4 text-primary" />Account Spotify</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Piano</span>
                          {isPremium ? (
                            <span className="font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">✨ Spotify Premium</span>
                          ) : (
                            <span className="font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">🔒 Spotify Free</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Connessione</span><div className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-4 h-4" />Attiva</div></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Dispositivo</span><span className="font-medium truncate max-w-[140px] text-right">{playbackState?.device?.name || "Nessuno"}</span></div>
                      </div>

                      {/* Simulatore Piano per Test */}
                      <div className="pt-2 border-t border-border/40">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                          <span>Simulatore Modalità Account</span>
                          <span className="text-[9px] uppercase tracking-wider text-primary font-mono">Test UI</span>
                        </p>
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-background/60 rounded-xl border border-border/40">
                          <button
                            onClick={() => setSimulatedTier("auto")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                              simulatedTier === "auto" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary text-muted-foreground"
                            }`}
                          >
                            Auto
                          </button>
                          <button
                            onClick={() => setSimulatedTier("premium")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                              simulatedTier === "premium" ? "bg-amber-500 text-black font-bold shadow-sm" : "hover:bg-secondary text-muted-foreground"
                            }`}
                          >
                            Premium
                          </button>
                          <button
                            onClick={() => setSimulatedTier("free")}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                              simulatedTier === "free" ? "bg-zinc-700 text-white font-bold shadow-sm" : "hover:bg-secondary text-muted-foreground"
                            }`}
                          >
                            Free
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* App info */}
                    <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Applicazione</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Versione</span><span className="font-medium">Music-Hub {APP_VERSION}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Database</span>{isSupabaseConfigured() ? <span className="font-semibold text-green-400">Supabase</span> : <span className="font-semibold text-amber-500">Offline</span>}</div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Build</span><span className="font-medium">{APP_BUILD}</span></div>
                      </div>
                    </div>

                    {/* Collab / Feedback */}
                    <div className="space-y-2">

                      {collabUser?.status !== "accepted" ? (
                        <>
                          <button onClick={() => setShowFeedbackPage(true)} className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500">Invia Feedback</button>
                          <button onClick={() => collabUser?.status !== "pending" && setShowCollabPage(true)} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${collabUser?.status === "pending" ? "bg-amber-600/35 text-white/50 cursor-default" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                            {collabUser?.status === "pending" ? <><Clock3 className="w-4 h-4 text-amber-500" />In attesa...</> : "Collabora con noi"}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Collaborazione Attiva</div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setShowCollabPage(true)} className="py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-semibold text-xs flex items-center justify-center gap-1"><Settings2 className="w-3.5 h-3.5" />Impostazioni</button>
                            <button onClick={() => setShowFeedbackPage(true)} className="py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-500 font-semibold text-xs flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Feedback</button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="pt-2 border-t border-border space-y-2">
                      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive font-semibold text-sm"><LogOut className="w-4 h-4" />Logout da Spotify</button>
                      <p className="text-xs text-muted-foreground text-center">Modifiche salvate automaticamente</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
