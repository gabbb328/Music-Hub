import React, { useEffect, useRef, useState } from "react";
import { User, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sticker-forge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { class?: string };
    }
  }
}

export interface StickerWrappedProps {
  topArtists: any[];
  topTracks: any[];
  minutesListened: number;
  coverUrl: string;
}

export default function StickerWrapped({ topArtists, topTracks, minutesListened, coverUrl }: StickerWrappedProps) {
  const stickerRef = useRef<any>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [stickerLoaded, setStickerLoaded] = useState(false);

  useEffect(() => {
    let script = document.querySelector('script[src="https://sticker.oooo.so/embed/sticker-forge.es.js"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'module');
      script.setAttribute('src', 'https://sticker.oooo.so/embed/sticker-forge.es.js');
      document.head.appendChild(script);
    }

    const initSticker = async () => {
      await customElements.whenDefined("sticker-forge");
      const sticker = stickerRef.current;
      
      let blurUrl = coverUrl;
      try {
        if (coverUrl) {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = coverUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 300;
          canvas.height = img.height || 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.filter = 'blur(15px)';
            ctx.drawImage(img, -10, -10, canvas.width + 20, canvas.height + 20); // Prevent clear edges
            blurUrl = canvas.toDataURL('image/png');
          }
        }
      } catch (e) {
        console.error("Error blurring cover", e);
      }

      if (sticker && typeof sticker.setSource === 'function') {
        await sticker.setSource({
          "type": "image",
          "src": blurUrl || "https://sticker.oooo.so/default-gallery/chatgpt.svg",
          "name": "Wrapped Cover"
        });
        sticker.setOptions({
          "outline": { "width": 8, "color": "#ffffff" },
          "shadow": { "opacity": 0.22, "blur": 22, "distance": 16, "angle": 42, "color": "#191823" },
          "peel": { "radius": 0.12, "stiffness": 0.72, "grabWidth": 22, "maxAngle": 3.55, "release": "snap" },
          "sound": { "enabled": true, "volume": 0.68 },
          "back": { "color": "#f7f5f2", "gloss": 0.7, "roughness": 0.3 },
          "tilt": -3,
          "wind": 0.25,
          "quality": "high"
        });
        setStickerLoaded(true);
      }
    };

    initSticker();
  }, [coverUrl]);

  // Handle pointer down and up on the sticker to detect peel action
  const handlePointerUp = () => {
    // When they let go of the sticker, reveal the stats (with a slight delay)
    if (!isRevealed) {
      setTimeout(() => setIsRevealed(true), 200);
    }
  };

  return (
    <div className="relative w-[380px] aspect-[9/16] rounded-[2rem] overflow-hidden bg-[#080d1e] flex flex-col justify-center items-center shadow-2xl border border-white/10">
      
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_50%),radial-gradient(circle_at_80%_20%,#8b5cf6_0%,transparent_50%),radial-gradient(circle_at_20%_80%,#ec4899_0%,transparent_50%)] animate-pulse" />
      </div>

      <AnimatePresence>
        {!isRevealed && (
          <motion.div 
            className="absolute inset-0 z-10"
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* The clear cover underneath the sticker */}
            <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(${coverUrl})` }} />
            
            {/* The Sticker Container */}
            <div 
              className="absolute inset-0 flex items-center justify-center z-50 cursor-grab active:cursor-grabbing"
              onPointerUp={handlePointerUp}
              onMouseUp={handlePointerUp}
              onTouchEnd={handlePointerUp}
            >
              <div className="relative flex flex-col items-center">
                <sticker-forge
                  ref={stickerRef}
                  style={{ display: 'block', width: '320px', height: '320px', visibility: stickerLoaded ? 'visible' : 'hidden' }}
                />
                <motion.div 
                  className="absolute -bottom-16 text-white/60 text-xs font-bold tracking-[0.2em] uppercase"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Peel to Reveal
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRevealed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute inset-0 z-20 p-8 flex flex-col h-full overflow-y-auto custom-scrollbar"
          >
            <div className="space-y-1 mb-8 text-center pt-4">
              <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-4xl font-black italic tracking-tighter">
                WRAPPED '26
              </h1>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                {minutesListened.toLocaleString()} Minuti Ascoltati
              </p>
            </div>

            <div className="flex-1 space-y-8">
              {/* Top Artists */}
              <div className="space-y-4">
                <h2 className="text-primary text-xs font-black uppercase tracking-widest border-b border-primary/20 pb-2">
                  Top 5 Artisti
                </h2>
                <div className="space-y-3">
                  {topArtists.slice(0, 5).map((artist: any, idx: number) => (
                    <motion.div 
                      key={artist.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (idx * 0.1) }}
                      className="flex items-center gap-3 bg-white/5 rounded-xl p-2 border border-white/5"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-primary/20">
                        {artist.images?.[0]?.url ? (
                          <img src={artist.images[0].url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><User size={16} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate text-sm">
                          <span className="text-primary/70 mr-2">#{idx + 1}</span> 
                          {artist.name}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Top Songs */}
              <div className="space-y-4 pb-4">
                <h2 className="text-primary text-xs font-black uppercase tracking-widest border-b border-primary/20 pb-2">
                  Top 5 Brani
                </h2>
                <div className="space-y-3">
                  {topTracks.slice(0, 5).map((track: any, idx: number) => (
                    <motion.div 
                      key={track.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + (idx * 0.1) }}
                      className="flex items-center gap-3 bg-white/5 rounded-xl p-2 border border-white/5"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary/20">
                        {track.album?.images?.[0]?.url ? (
                          <img src={track.album.images[0].url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Music size={16} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate text-sm">
                          <span className="text-primary/70 mr-2">#{idx + 1}</span>
                          {track.name}
                        </p>
                        <p className="text-white/50 text-[10px] truncate">
                          {track.artists?.[0]?.name}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              className="text-center mt-6 pb-2"
            >
               <Button onClick={() => setIsRevealed(false)} variant="ghost" size="sm" className="text-white/50 hover:text-white">
                  Reset
               </Button>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
