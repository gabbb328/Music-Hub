import { useState, useEffect, useCallback } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Play, Music, GripVertical, ChevronUp, ChevronDown, X, ListMusic, Loader2 } from "lucide-react";
import { Track, formatTime } from "@/lib/mock-data";
import { useQueue, usePlayMutation } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";

interface QueueContentProps {
  queue: Track[];
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const img    = (t: any) => t?.album?.images?.[0]?.url || t?.cover || "";
const name   = (t: any) => t?.name || t?.title || "Unknown";
const artist = (t: any) => t?.artists?.[0]?.name || t?.artist || "";
const dur    = (t: any) => Math.floor((t?.duration_ms ?? (t?.duration ?? 0) * 1000) / 1000);

const toLocalTrack = (t: SpotifyTrack): Track => ({
  id: t.id,
  title: t.name,
  artist: t.artists[0]?.name || "Unknown Artist",
  album: t.album.name,
  cover: t.album.images[0]?.url || "",
  duration: Math.floor(t.duration_ms / 1000),
});

// ─── QueueItem ────────────────────────────────────────────────────────────────
function QueueItem({
  track, index, total,
  onPlay, onMoveUp, onMoveDown, onRemove,
}: {
  track: any; index: number; total: number;
  onPlay: () => void; onMoveUp: () => void;
  onMoveDown: () => void; onRemove: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={controls}
      as="div"
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 50 }}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-secondary/40 select-none bg-transparent"
    >
      {/* Handle drag — SEMPRE visibile, colore diverso su mobile */}
      <button
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0 p-1 -ml-1"
        onPointerDown={e => { e.preventDefault(); e.stopPropagation(); controls.start(e); }}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Numero posizione */}
      <span className="text-sm text-muted-foreground font-medium w-5 shrink-0 text-center tabular-nums">
        {index + 1}
      </span>

      {/* Cover */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
        {img(track) && <img src={img(track)} alt="" className="object-cover w-full h-full" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name(track)}</p>
        <p className="text-xs text-muted-foreground truncate">{artist(track)}</p>
      </div>

      {/* Durata */}
      <span className="text-xs text-muted-foreground tabular-nums hidden sm:block shrink-0">
        {formatTime(dur(track))}
      </span>

      {/* Azioni — su/giù sempre visibili, play/x on-hover */}
      <div className="flex items-center gap-0.5 shrink-0">

        {/* ↑↓ sempre visibili */}
        <div className="flex flex-col">
          <button
            onClick={e => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
            title="Sposta su"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMoveDown(); }}
            disabled={index >= total - 1}
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
            title="Sposta giù"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Play — on hover */}
        <button
          onClick={e => { e.stopPropagation(); onPlay(); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60
                     opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
          title="Riproduci"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Rimuovi — on hover */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10
                     opacity-0 group-hover:opacity-100 transition-opacity"
          title="Rimuovi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

// ─── QueueContent ─────────────────────────────────────────────────────────────
const QueueContent = ({ queue: localQueue, currentTrack: localCurrent, onPlayTrack }: QueueContentProps) => {
  const { data: queueData, isLoading } = useQueue();
  const playMutation = usePlayMutation();

  const spotifyCurrent = queueData?.currently_playing;
  const spotifyItems   = queueData?.queue as any[] | undefined;

  const currentTrack = spotifyCurrent || localCurrent;

  // ── Unica sorgente di verità per la coda ──────────────────────────────────
  // Inizializzata con i dati locali; sostituita con Spotify appena disponibile
  const [items, setItems] = useState<any[]>(localQueue);

  useEffect(() => {
    if (spotifyItems && spotifyItems.length > 0) {
      setItems(spotifyItems);
    }
  }, [spotifyItems]);

  // Se la coda locale cambia e Spotify non è ancora disponibile
  useEffect(() => {
    if (!spotifyItems || spotifyItems.length === 0) {
      setItems(localQueue);
    }
  }, [localQueue, spotifyItems]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePlay = useCallback((track: any) => {
    // Prova a riprodurre via Spotify se ha uri
    if (track?.uri) {
      playMutation.mutate({ uris: [track.uri] });
    }
    // Aggiorna sempre il player locale
    if (track?.id) {
      onPlayTrack(toLocalTrack(track as SpotifyTrack));
    }
  }, [playMutation, onPlayTrack]);

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setItems(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setItems(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const remove = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0 border-b border-border/30">
        <ListMusic className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${items.length} brani in coda`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">

        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Caricamento coda…</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">

            {/* Now Playing */}
            {currentTrack && (
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2 px-2">
                  In riproduzione
                </p>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(var(--primary-rgb, 99 102 241) / 0.08)", border: "1px solid rgba(var(--primary-rgb, 99 102 241) / 0.18)" }}>
                  {/* Indicatore pulsante */}
                  <div className="w-6 shrink-0 flex items-center justify-center">
                    <motion.div className="w-2.5 h-2.5 rounded-full bg-primary"
                      animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                    {img(currentTrack) && <img src={img(currentTrack)} alt="" className="object-cover w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-primary">{name(currentTrack)}</p>
                    <p className="text-xs text-muted-foreground truncate">{artist(currentTrack)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                    {formatTime(dur(currentTrack))}
                  </span>
                </div>
              </section>
            )}

            {/* Next */}
            <section>
              <div className="flex items-center justify-between mb-2 px-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Prossimi ({items.length})
                </p>
                <p className="text-[10px] text-muted-foreground/50 hidden sm:block">
                  ⠿ trascina · ↑↓ riordina
                </p>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Music className="w-14 h-14 text-muted-foreground/20 mb-3" />
                  <p className="font-semibold text-sm mb-1">Coda vuota</p>
                  <p className="text-xs text-muted-foreground">Aggiungi brani per vederli qui</p>
                </div>
              ) : (
                /*
                  CHIAVE DEL FIX:
                  - Reorder.Group riceve SEMPRE `items` (la state locale)
                  - onReorder aggiorna SOLO setItems — nessuna logica ibrida
                  - La key di ogni item è univoca e stabile: track.id (non index-dipendente)
                  - Per tracce duplicate aggiungiamo l'indice solo come fallback
                */
                <Reorder.Group
                  axis="y"
                  values={items}
                  onReorder={setItems}
                  className="space-y-1"
                  as="div"
                >
                  {items.map((track, index) => (
                    <QueueItem
                      key={`${track.id ?? track.title}-${index}`}
                      track={track}
                      index={index}
                      total={items.length}
                      onPlay={() => handlePlay(track)}
                      onMoveUp={() => moveUp(index)}
                      onMoveDown={() => moveDown(index)}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </Reorder.Group>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueContent;
