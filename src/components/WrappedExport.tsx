import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, Share2, Music, User, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface WrappedExportProps {
  topArtist: string;
  topTrack: string;
  topGenre: string;
  minutesListened: number;
  coverUrl: string;
}

export default function WrappedExport({ topArtist, topTrack, topGenre, minutesListened, coverUrl }: WrappedExportProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!exportRef.current) return;
    
    toast({ title: "Generazione immagine...", description: "Stiamo preparando il tuo Wrapped." });
    
    try {
      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        backgroundColor: "#0a0e27",
        scale: 2
      });
      
      const link = document.createElement("a");
      link.download = "harmony-hub-wrapped.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast({ title: "Scaricato!", description: "La tua immagine è pronta." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Errore", description: "Impossibile generare l'immagine.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Container da esportare */}
      <div className="flex justify-center">
        <div 
          ref={exportRef}
          className="w-[360px] aspect-[9/16] bg-[#0a0e27] p-8 flex flex-col justify-between relative overflow-hidden rounded-3xl"
        >
          {/* Sfondo Astratto */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_50%),radial-gradient(circle_at_80%_20%,#8b5cf6_0%,transparent_50%),radial-gradient(circle_at_20%_80%,#ec4899_0%,transparent_50%)] animate-pulse" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="space-y-1">
              <h1 className="text-white text-3xl font-black italic tracking-tighter">WRAPPED</h1>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Harmony Hub • 2026</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Artista Top</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-white text-xl font-bold truncate">{topArtist}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Brano Preferito</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
                    {coverUrl ? <img src={coverUrl} className="w-full h-full object-cover" /> : <Music className="w-5 h-5 text-primary" />}
                  </div>
                  <p className="text-white text-lg font-bold truncate">{topTrack}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Genere Dominante</p>
                <p className="text-white text-2xl font-black uppercase italic">{topGenre}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <p className="text-white/60 text-[10px] font-bold uppercase mb-1">Minuti di ascolto</p>
              <p className="text-white text-4xl font-black tracking-tight">{minutesListened.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-[8px] font-bold tracking-widest uppercase">Creato con Harmony Hub</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={handleDownload} className="gap-2 px-8">
          <Download className="w-4 h-4" /> Scarica Immagine
        </Button>
      </div>
    </div>
  );
}
