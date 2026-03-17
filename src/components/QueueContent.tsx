import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Play, Music, GripVertical, ChevronUp, ChevronDown, X, ListMusic } from "lucide-react";
import { Track, formatTime } from "@/lib/mock-data";
import { useQueue, usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";

interface QueueContentProps {
  queue: Track[];
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
}

const convertSpotifyTrack = (t: SpotifyTrack): Track => ({
  id: t.id,
  title: t.name,
  artist: t.artists[0]?.name || "Unknown Artist",
  album: t.album.name,
  cover: t.album.images[0]?.url || "",
  duration: Math.floor(t.duration_ms / 1000),
  bpm: undefined,
});

const getTrackImg  = (t: any) => t?.album?.images?.[0]?.url || t?.cover || "";
const getTrackName = (t: any) => t?.name || t?.title || "Unknown";
const getTrackArtist = (t: any) => t?.artists?.[0]?.name || t?.artist || "";
const getTrackDur  = (t: any) => Math.floor((t?.duration_ms || (t?.duration ?? 0) * 1000) / 1000);

// ─── Riga coda riordinabile ───────────────────────────────────────────────────
function QueueItem({
  track,
  index,
  total,
  isActive,
  onPlay,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  track: any;
  index: number;
  total: number;
  isActive?: boolean;
  onPlay: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();
  const [showActions, setShowActions] = useState(false);

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors select-none
        ${isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/40"}`}
    >
      {/* Numero / drag handle */}
      <div className="flex items-center w-8 shrink-0">
        {/* Desktop: numero che diventa handle on hover */}
        <span className="text-sm text-muted-foreground font-medium group-hover:hidden">{index + 1}</span>
        <button
          className="hidden group-hover:flex touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          onPointerDown={e => { e.preventDefault(); dragControls.start(e); }}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        {/* Mobile: handle sempre visibile */}
        <button
          className="md:hidden touch-none cursor-grab active:cursor-grabbing text-muted-foreground/60"
          onPointerDown={e => { e.preventDefault(); dragControls.start(e); }}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Cover */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
        {getTrackImg(track) && (
          <img src={getTrackImg(track)} alt="" className="object-cover w-full h-full" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isActive ? "text-primary" : ""}`}>
          {getTrackName(track)}
        </p>
        <p className="text-xs text-muted-foreground truncate">{getTrackArtist(track)}</p>
      </div>

      {/* Durata */}
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:block">
        {formatTime(getTrackDur(track))}
      </span>

      {/* Azioni */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Su / Giù — sempre visibili su mobile, on-hover su desktop */}
        <div className="flex flex-col md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
            title="Sposta su"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
            title="Sposta giù"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Play */}
        <button
          onClick={onPlay}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          title="Riproduci"
        >
          <Play className="w-3.5 h-3.5" />
        </button>

        {/* Rimuovi */}
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Rimuovi dalla coda"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
const QueueContent = ({ queue: localQueue, currentTrack: localCurrentTrack, onPlayTrack }: QueueContentProps) => {
  const { data: queueData, isLoading } = useQueue();
  const playMutation = usePlayMutation();

  const currentTrack  = queueData?.currently_playing || localCurrentTrack;
  const spotifyQueue  = queueData?.queue as any[] | undefined;

  // Coda locale modificabile (copia iniziale dalla coda Spotify o locale)
  const [localItems, setLocalItems] = useState<any[]>(() =>
    spotifyQueue ?? localQueue
  );

  // Aggiorna se arriva nuova coda da Spotify (solo se non ha ancora dati)
  const initializedRef = useRef(false);
  if (!initializedRef.current && spotifyQueue && spotifyQueue.length > 0) {
    initializedRef.current = true;
    // Non chiamiamo setLocalItems qui — usiamo un useEffect
  }

  const handlePlay = useCallback((track: any) => {
    if (track?.uri) {
      playMutation.mutate({ uris: [track.uri] });
      onPlayTrack(convertSpotifyTrack(track));
    } else if (track?.id) {
      onPlayTrack(track as Track);
    }
  }, [playMutation, onPlayTrack]);

  const moveItem = useCallback((fromIndex: number, direction: "up" | "down") => {
    setLocalItems(prev => {
      const arr  = [...prev];
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= arr.length) return arr;
      [arr[fromIndex], arr[toIndex]] = [arr[toIndex], arr[fromIndex]];
      return arr;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setLocalItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Usa la coda Spotify appena disponibile per inizializzare
  const items = (spotifyQueue && spotifyQueue.length > 0 && !initializedRef.current)
    ? spotifyQueue
    : localItems.length > 0
      ? localItems
      : spotifyQueue ?? [];

  // Sincronizza con Spotify se arriva per la prima volta
  if (spotifyQueue && spotifyQueue.length > 0 && !initializedRef.current) {
    initializedRef.current = true;
    Promise.resolve().then(() => setLocalItems(spotifyQueue));
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
        <ListMusic className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coda</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Caricamento…" : `${localItems.length} brani in coda`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Now Playing ── */}
            {currentTrack && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-1">
                  In riproduzione
                </p>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/8 border border-primary/15">
                  <div className="w-8 shrink-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </motion.div>
                  </div>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                    {getTrackImg(currentTrack) && (
                      <img src={getTrackImg(currentTrack)} alt="" className="object-cover w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-primary">{getTrackName(currentTrack)}</p>
                    <p className="text-xs text-muted-foreground truncate">{getTrackArtist(currentTrack)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                    {formatTime(getTrackDur(currentTrack))}
                  </span>
                </div>
              </div>
            )}

            {/* ── Next in Queue ── */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Prossimi brani
                </p>
                <p className="text-xs text-muted-foreground">
                  Trascina ⠿ o usa ↑↓ per riordinare
                </p>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Music className="w-14 h-14 text-muted-foreground/25 mb-4" />
                  <h3 className="font-semibold mb-1">Coda vuota</h3>
                  <p className="text-sm text-muted-foreground">Aggiungi brani per vederli qui</p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={items}
                  onReorder={setLocalItems}
                  className="space-y-1"
                >
                  <AnimatePresence initial={false}>
                    {items.map((track, index) => (
                      <QueueItem
                        key={track.id + "-" + index}
                        track={track}
                        index={index}
                        total={items.length}
                        onPlay={() => handlePlay(track)}
                        onMoveUp={() => moveItem(index, "up")}
                        onMoveDown={() => moveItem(index, "down")}
                        onRemove={() => removeItem(index)}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QueueContent;
