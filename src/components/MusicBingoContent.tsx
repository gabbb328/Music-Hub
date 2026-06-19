/**
 * MusicBingoContent
 *
 * Bingo 5×5 basato sui generi musicali della libreria Spotify dell'utente.
 * - Cartella generata randomicamente con 24 generi + FREE al centro
 * - I generi vengono estratti uno alla volta ogni ~8s (auto-draw)
 * - L'utente spunta le celle manualmente
 * - Vittoria: riga, colonna o diagonale completata
 * - Il punteggio (righe/colonne/diagonali vinte) viene salvato in classifica
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Trophy, Play, Square, CheckSquare, RotateCcw, Music2, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameLeaderboard } from "@/hooks/useGameLeaderboard";

// ── Generi disponibili ────────────────────────────────────────

const ALL_GENRES = [
  "Pop", "Rock", "Hip-Hop", "Electronic", "Jazz", "Classical",
  "R&B", "Metal", "Folk", "Reggae", "Latin", "Country",
  "Soul", "Funk", "Indie", "Blues", "Punk", "Gospel",
  "Ambient", "Disco", "Trap", "K-Pop", "Ska", "Drum & Bass",
  "House", "Techno", "Grunge", "Emo", "Alternative", "New Wave",
  "Afrobeats", "Bossa Nova",
];

const BINGO_SIZE = 5;
const FREE_INDEX = 12; // centro della griglia 5×5

// ── Tipi locali ───────────────────────────────────────────────

interface BingoCell {
  genre: string;
  marked: boolean;
  isFree?: boolean;
}

type WinResult = {
  lines: Array<{ type: "row" | "col" | "diag"; index: number }>;
  count: number;
};

// ── Helpers ───────────────────────────────────────────────────

function generateCard(): BingoCell[][] {
  const shuffled = [...ALL_GENRES].sort(() => Math.random() - 0.5).slice(0, 24);
  const flat: BingoCell[] = shuffled.map((g) => ({ genre: g, marked: false }));
  // Inserisce FREE al centro
  flat.splice(FREE_INDEX, 0, { genre: "FREE", marked: true, isFree: true });

  const grid: BingoCell[][] = [];
  for (let r = 0; r < BINGO_SIZE; r++) {
    grid.push(flat.slice(r * BINGO_SIZE, r * BINGO_SIZE + BINGO_SIZE));
  }
  return grid;
}

function checkWins(grid: BingoCell[][]): WinResult {
  const lines: WinResult["lines"] = [];

  for (let r = 0; r < BINGO_SIZE; r++) {
    if (grid[r].every((c) => c.marked)) lines.push({ type: "row", index: r });
  }
  for (let c = 0; c < BINGO_SIZE; c++) {
    if (grid.every((row) => row[c].marked)) lines.push({ type: "col", index: c });
  }
  if (grid.every((row, i) => row[i].marked)) lines.push({ type: "diag", index: 0 });
  if (grid.every((row, i) => row[BINGO_SIZE - 1 - i].marked)) lines.push({ type: "diag", index: 1 });

  return { lines, count: lines.length };
}

function isCellInWin(r: number, c: number, wins: WinResult["lines"]): boolean {
  return wins.some((w) => {
    if (w.type === "row") return w.index === r;
    if (w.type === "col") return w.index === c;
    if (w.type === "diag" && w.index === 0) return r === c;
    if (w.type === "diag" && w.index === 1) return r === BINGO_SIZE - 1 - c;
    return false;
  });
}

// ── Componente ────────────────────────────────────────────────

interface MusicBingoContentProps {
  playerName: string;
}

export default function MusicBingoContent({ playerName }: MusicBingoContentProps) {
  const [gameState, setGameState] = useState<"setup" | "playing" | "finished">("setup");
  const [grid, setGrid] = useState<BingoCell[][]>([]);
  const [drawPool, setDrawPool] = useState<string[]>([]);
  const [drawnGenres, setDrawnGenres] = useState<string[]>([]);
  const [currentDraw, setCurrentDraw] = useState<string | null>(null);
  const [wins, setWins] = useState<WinResult>({ lines: [], count: 0 });
  const [autoPlay, setAutoPlay] = useState(true);
  const [savedScore, setSavedScore] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addEntry } = useGameLeaderboard();

  // ── Avvia partita ─────────────────────────────────────────

  const startGame = useCallback(() => {
    const card = generateCard();
    const genres = card.flat().filter((c) => !c.isFree).map((c) => c.genre);
    const pool = [...genres, ...ALL_GENRES.filter((g) => !genres.includes(g))]
      .sort(() => Math.random() - 0.5);

    setGrid(card);
    setDrawPool(pool);
    setDrawnGenres([]);
    setCurrentDraw(null);
    setWins({ lines: [], count: 0 });
    setSavedScore(false);
    setAutoPlay(true);
    setGameState("playing");
  }, []);

  // ── Estrai prossimo genere ────────────────────────────────

  const drawNext = useCallback(() => {
    setDrawPool((pool) => {
      if (pool.length === 0) return pool;
      const [next, ...rest] = pool;
      setCurrentDraw(next);
      setDrawnGenres((prev) => [next, ...prev]);
      return rest;
    });
  }, []);

  // ── Auto-draw ogni 8s ─────────────────────────────────────

  useEffect(() => {
    if (gameState !== "playing" || !autoPlay) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(drawNext, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [gameState, autoPlay, drawNext]);

  // ── Spunta cella ──────────────────────────────────────────

  const toggleCell = useCallback((r: number, c: number) => {
    setGrid((prev) => {
      if (prev[r][c].isFree) return prev;
      const next = prev.map((row, ri) =>
        row.map((cell, ci) =>
          ri === r && ci === c ? { ...cell, marked: !cell.marked } : cell
        )
      );
      const newWins = checkWins(next);
      setWins(newWins);
      return next;
    });
  }, []);

  // ── Fine partita ──────────────────────────────────────────

  const finishGame = useCallback(() => {
    setGameState("finished");
    setAutoPlay(false);
    if (!savedScore) {
      const name = playerName.trim() || "Anonimo";
      addEntry("bingo", name, wins.count, `${wins.count} linee`);
      setSavedScore(true);
    }
  }, [wins.count, savedScore, playerName, addEntry]);

  // Controlla vittoria automatica (blackout o prima linea)
  useEffect(() => {
    if (gameState !== "playing") return;
    if (wins.count >= 1 && gameState === "playing") {
      // Non termina in automatico — l'utente decide quando fermarsi
    }
  }, [wins.count, gameState]);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* SETUP */}
      {gameState === "setup" && (
        <Card className="p-8 border-border/40 bg-card/50 backdrop-blur-sm flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Music2 className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Music Bingo</h2>
            <p className="text-muted-foreground max-w-md text-sm">
              Ricevi una cartella con 24 generi musicali. Ogni 8 secondi viene estratto un genere —
              spunta la cella se ce l'hai! Completa righe, colonne o diagonali per vincere.
            </p>
          </div>
          <Button onClick={startGame} className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20">
            <Shuffle className="w-5 h-5 mr-2" /> Genera Cartella &amp; Inizia
          </Button>
        </Card>
      )}

      {/* IN GIOCO */}
      {gameState === "playing" && (
        <div className="space-y-4">
          {/* Controlli */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={drawNext} className="gap-1.5">
                <Shuffle className="w-4 h-4" /> Prossimo
              </Button>
              <Button
                size="sm"
                variant={autoPlay ? "default" : "outline"}
                onClick={() => setAutoPlay((v) => !v)}
                className="gap-1.5"
              >
                {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {autoPlay ? "Pausa auto" : "Auto ON"}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {wins.count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-sm font-bold text-yellow-500 flex items-center gap-1"
                >
                  <Trophy className="w-4 h-4" /> {wins.count} {wins.count === 1 ? "linea" : "linee"}!
                </motion.span>
              )}
              <Button size="sm" variant="destructive" onClick={finishGame} className="gap-1.5">
                Termina
              </Button>
            </div>
          </div>

          {/* Genere estratto */}
          <AnimatePresence mode="wait">
            {currentDraw && (
              <motion.div
                key={currentDraw}
                initial={{ y: -20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="flex items-center justify-center"
              >
                <div className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30">
                  🎵 {currentDraw}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Griglia */}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${BINGO_SIZE}, 1fr)` }}
          >
            {grid.flat().map((cell, idx) => {
              const r = Math.floor(idx / BINGO_SIZE);
              const c = idx % BINGO_SIZE;
              const inWin = isCellInWin(r, c, wins.lines);
              const isJustDrawn = cell.genre === currentDraw;

              return (
                <motion.button
                  key={`${r}-${c}`}
                  onClick={() => toggleCell(r, c)}
                  whileTap={cell.isFree ? {} : { scale: 0.92 }}
                  animate={inWin ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={[
                    "aspect-square rounded-xl flex flex-col items-center justify-center p-1 text-center border transition-all duration-200 cursor-pointer text-[10px] leading-tight font-medium",
                    cell.isFree
                      ? "bg-primary text-primary-foreground border-primary cursor-default font-black text-xs"
                      : cell.marked
                      ? inWin
                        ? "bg-yellow-500/90 border-yellow-400 text-black shadow-md shadow-yellow-500/30"
                        : "bg-primary/80 border-primary text-primary-foreground"
                      : isJustDrawn
                      ? "border-primary/60 bg-primary/10 animate-pulse"
                      : "bg-card/60 border-border/40 hover:border-primary/30 hover:bg-accent/30 text-foreground",
                  ].join(" ")}
                >
                  {cell.isFree ? (
                    <span className="text-[10px] font-black">FREE</span>
                  ) : (
                    <>
                      {cell.marked ? (
                        <CheckSquare className="w-3 h-3 mb-0.5 shrink-0" />
                      ) : (
                        <Square className="w-3 h-3 mb-0.5 shrink-0 opacity-40" />
                      )}
                      <span className="truncate w-full px-0.5">{cell.genre}</span>
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Ultimi estratti */}
          {drawnGenres.length > 1 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold mr-1">Già estratti:</span>
              {drawnGenres.slice(1, 8).join(" · ")}
              {drawnGenres.length > 8 && ` · +${drawnGenres.length - 8} altri`}
            </div>
          )}
        </div>
      )}

      {/* FINE PARTITA */}
      {gameState === "finished" && (
        <Card className="p-10 border-primary/30 bg-primary/5 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter">BINGO!</h2>
            <p className="text-5xl font-black text-primary mt-2">{wins.count}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {wins.count === 0 ? "linee completate" : wins.count === 1 ? "linea completata 🎉" : "linee completate 🔥"}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            {wins.count === 0 ? "Continua ad ascoltare — arriverà il momento!" :
             wins.count >= 4 ? "Dominante! Conosci tutti i generi 🏆" :
             "Ottima partita!"}
          </p>
          {savedScore && (
            <p className="text-xs text-muted-foreground">
              ✅ Salvato in classifica come <strong>{playerName || "Anonimo"}</strong>
            </p>
          )}
          <Button onClick={startGame} className="h-12 px-8 rounded-full gap-2">
            <RotateCcw className="w-4 h-4" /> Nuova Cartella
          </Button>
        </Card>
      )}
    </div>
  );
}
