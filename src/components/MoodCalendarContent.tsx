import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Trash2, Check, Sparkles, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoodCalendar, MOOD_COLORS, MOOD_META } from "@/hooks/useMoodCalendar";
import { useRecentlyPlayed } from "@/hooks/useSpotify";
import type { MoodId } from "@/types/features";

// ── Mood list (per override manuale) ─────────────────────────
const MOODS = (Object.keys(MOOD_META) as MoodId[]).map((id) => ({
  id,
  ...MOOD_META[id],
}));

// ── Helpers calendario ────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekday(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7; // Lun=0
}
function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// ── Componente principale ─────────────────────────────────────
const MoodCalendarContent: React.FC = () => {
  const {
    calendar, todayEntry,
    saveMoodManual, autoSaveMood,
    removeMood, updateNote, clearAll,
    stats,
  } = useMoodCalendar();

  // Brani recenti per auto-detect
  const { data: recentData, isLoading: loadingRecent } = useRecentlyPlayed(50);

  // Auto-detect mood al mount e quando cambiano i brani
  useEffect(() => {
    if (!recentData?.items?.length) return;

    // Filtra solo i brani ascoltati oggi
    const todayStr = todayKey();
    const todayItems = recentData.items.filter((item: any) => {
      const playedDate = item.played_at?.slice(0, 10);
      return playedDate === todayStr;
    });

    if (todayItems.length === 0) return;

    const tracks = todayItems.map((item: any) => item.track);
    const trackRefs = tracks.slice(0, 5).map((t: any) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.[0]?.name ?? "",
    }));

    autoSaveMood(tracks, trackRefs);
  }, [recentData, autoSaveMood]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pickedMood, setPickedMood] = useState<MoodId | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const today = todayKey();
  const days = getDaysInMonth(viewYear, viewMonth);
  const offset = getFirstWeekday(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(key);
    setPickedMood((calendar[key] as any)?.moodId ?? null);
    setNoteText(calendar[key]?.note ?? "");
  };

  const handleSaveManual = () => {
    if (!selectedDate || !pickedMood) return;
    saveMoodManual(pickedMood, { date: selectedDate, note: noteText });
    setSelectedDate(null);
    setShowOverride(false);
  };

  const todayMeta = todayEntry ? MOOD_META[todayEntry.moodId] : null;
  const isAutoDetected = (todayEntry as any)?.autoDetected !== false;
  const moodStats = stats();

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diario Musicale</h1>
            <p className="text-muted-foreground">Il tuo stato d'animo rilevato automaticamente.</p>
          </div>
        </div>

        {/* ── Card mood di oggi (AUTO-DETECT) ── */}
        <Card className="p-5 border-border/40 bg-card/50 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Mood di oggi — rilevato automaticamente
            </p>
            {loadingRecent && (
              <span className="text-xs text-muted-foreground animate-pulse">Analisi brani...</span>
            )}
          </div>

          {todayEntry && todayMeta ? (
            <div className="flex items-center gap-4">
              {/* Emoji grande */}
              <motion.div
                key={todayEntry.moodId}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-md"
                style={{ backgroundColor: `${todayEntry.color}30`, border: `2px solid ${todayEntry.color}66` }}
              >
                {todayMeta.emoji}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold" style={{ color: todayEntry.color }}>
                  {todayMeta.label}
                </p>
                {isAutoDetected ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Basato su {todayEntry.tracks?.length
                      ? `${todayEntry.tracks.length} brani ascoltati oggi`
                      : "i tuoi ascolti di oggi"}
                  </p>
                ) : (
                  <p className="text-xs text-primary/70 mt-0.5 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Impostato manualmente
                  </p>
                )}

                {/* Brani usati per il rilevamento */}
                {todayEntry.tracks && todayEntry.tracks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {todayEntry.tracks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground truncate max-w-[120px]"
                      >
                        {t.name}
                      </span>
                    ))}
                    {todayEntry.tracks.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground">
                        +{todayEntry.tracks.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowOverride(!showOverride)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Cambia mood manualmente"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Cambia
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="w-12 h-12 rounded-2xl bg-secondary/40 flex items-center justify-center text-2xl animate-pulse">
                🎵
              </div>
              <div>
                <p className="font-medium">Nessun brano ascoltato oggi ancora</p>
                <p className="text-xs opacity-70">Il mood apparirà non appena inizierai ad ascoltare musica.</p>
              </div>
            </div>
          )}

          {/* Override manuale (collassabile) */}
          <AnimatePresence>
            {showOverride && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/30 space-y-3">
                  <p className="text-xs text-muted-foreground">Scegli tu il mood per oggi:</p>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => {
                      const isSel = todayEntry?.moodId === m.id && !(todayEntry as any)?.autoDetected;
                      return (
                        <motion.button
                          key={m.id}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => {
                            saveMoodManual(m.id, { date: today });
                            setShowOverride(false);
                          }}
                          className={[
                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                            isSel
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/40 bg-secondary/30 hover:bg-accent/50",
                          ].join(" ")}
                        >
                          {m.emoji} {m.label}
                          {isSel && <Check className="w-3 h-3" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* ── Statistiche rapide ── */}
        {moodStats.total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 border-border/30 bg-card/40 text-center">
              <p className="text-2xl font-black">{moodStats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Giorni registrati</p>
            </Card>
            <Card className="p-3 border-border/30 bg-card/40 text-center">
              <p className="text-2xl">
                {moodStats.mostFrequentMood ? MOOD_META[moodStats.mostFrequentMood].emoji : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {moodStats.mostFrequentMood ? MOOD_META[moodStats.mostFrequentMood].label : "Nessuno"}
              </p>
            </Card>
            <Card className="p-3 border-border/30 bg-card/40 text-center">
              <p className="text-2xl font-black text-primary">
                {moodStats.mostFrequentMood ? (moodStats.counts[moodStats.mostFrequentMood] ?? 0) : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Mood prevalente</p>
            </Card>
          </div>
        )}

        {/* ── Calendario ── */}
        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
          {/* Nav mese */}
          <div className="flex items-center justify-between mb-5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth}
              className="w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <h2 className="font-semibold text-lg capitalize">{formatMonthYear(viewYear, viewMonth)}</h2>
            <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth}
              className="w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Header giorni */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Griglia */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, i) => <div key={`off-${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const entry = calendar[key] as any;
              const isToday = key === today;
              const isSel = selectedDate === key;
              const isAuto = entry?.autoDetected !== false;

              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleDayClick(day)}
                  className={[
                    "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5",
                    "border transition-all duration-150 cursor-pointer hover:bg-accent/40",
                    isSel ? "border-primary ring-2 ring-primary/30"
                      : isToday ? "border-primary/50"
                      : "border-transparent hover:border-border/60",
                  ].join(" ")}
                  style={entry ? {
                    backgroundColor: `${entry.color}22`,
                    borderColor: isSel ? undefined : `${entry.color}88`,
                  } : {}}
                >
                  <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                    {day}
                  </span>
                  {entry && (
                    <span className="text-[10px] leading-none relative">
                      {MOOD_META[entry.moodId as MoodId]?.emoji ?? "•"}
                      {/* Pallino blu = auto, nessuno = manuale */}
                      {isAuto && (
                        <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-primary border border-background" />
                      )}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legenda pallino */}
          <p className="text-[10px] text-muted-foreground/50 mt-3 text-right">
            🔵 = rilevato automaticamente
          </p>
        </Card>

        {/* ── Pannello dettaglio giorno selezionato ── */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <Card className="p-6 space-y-4 border-primary/20 bg-primary/5">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("it-IT", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </h3>
                  {calendar[selectedDate] && (
                    <button
                      onClick={() => { removeMood(selectedDate); setSelectedDate(null); }}
                      className="text-destructive/70 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPickedMood(m.id)}
                      className={[
                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm border transition-all",
                        pickedMood === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/40 hover:bg-accent/40",
                      ].join(" ")}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Aggiungi una nota…"
                  rows={3}
                  className="w-full rounded-xl bg-background/60 border border-border/40 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />

                <div className="flex gap-3">
                  <Button onClick={handleSaveManual} disabled={!pickedMood} className="flex-1">
                    <Check className="w-4 h-4 mr-2" /> Salva (manuale)
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedDate(null)}>Annulla</Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legenda mood */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {MOODS.map((m) => (
            <span key={m.id} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: MOOD_COLORS[m.id] }} />
              {m.emoji} {m.label}
            </span>
          ))}
        </div>

        {/* Clear */}
        <div className="pt-2">
          {showClearConfirm ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Sicuro? Perderai tutto il diario.</span>
              <Button variant="destructive" size="sm" onClick={() => { clearAll(); setShowClearConfirm(false); }}>
                Sì, cancella
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)}>No</Button>
            </motion.div>
          ) : (
            <button
              className="text-xs text-muted-foreground/60 hover:text-destructive/70 transition-colors"
              onClick={() => setShowClearConfirm(true)}
            >
              Cancella tutto il diario
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodCalendarContent;
