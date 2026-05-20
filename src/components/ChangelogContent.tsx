import { motion } from "framer-motion";
import { ScrollText, GitCommit, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ChangelogEntry {
  date: string;
  version: string;
  commits: string[];
}

const changelogData: ChangelogEntry[] = [
  {
    date: "19 Maggio 2026",
    version: "v1.4.0",
    commits: [
      "Integrazione del modulo di feedback utenti e pannello monitoraggio admin",
      "Autenticazione Admin in tempo reale tramite database Supabase (senza .env)",
      "Sistema di notifiche push PWA nativo e banner toast in-app per l'Admin",
      "Fallback mailto nativo per garantire le notifiche di collaborazione all'admin",
      "Risoluzione del bug di layout dei pulsanti collaboratore (visibilità solida)",
      "Risoluzione delle RLS policy di Supabase per la sincronizzazione stabile",
      "Approvazione collaboratore via email senza permessi automatici preimpostati"
    ]
  },
  {
    date: "17 Maggio 2026",
    version: "v1.3.2",
    commits: [
      "Risoluzione bug di login di spotify tramite PWA su Mobile",
      "Risoluzione bug di riproduzione su Mobile",
      "Aggiunta pagina di gestione del sito per admin",
      "Aggiunta pagina di account",
      "Aggiunta la possibilità di inviare una richiesta di collaborazione all'admin"
    ]
  },
  {
    date: "15 Maggio 2026",
    version: "v1.3.1",
    commits: [
      "Sistema di raggruppamento brani recenti con moltiplicatori dinamici",
      "Ottimizzazione della documentazione tecnica e README",
      "Risoluzione di bug critici nella gestione della coda"
    ]
  },
  {
    date: "14 Maggio 2026",
    version: "v1.3.0",
    commits: [
      "Miglioramenti globali all'estetica e fluidità dell'interfaccia",
      "Implementazione della vista classica stile iPod Retro",
      "Ottimizzazione del sistema di gestione finestre NowPlaying"
    ]
  },
  {
    date: "15 Aprile 2026",
    version: "v1.2.3",
    commits: [
      "Risoluzione problemi di sincronizzazione con i dispositivi Alexa"
    ]
  },
  {
    date: "11 Aprile 2026",
    version: "v1.2.2",
    commits: [
      "Ottimizzazione per iOS e supporto Safari mobile",
      "Fix animazioni del piatto rotante nella vista Vinile"
    ]
  },
  {
    date: "9 Aprile 2026",
    version: "v1.2.1",
    commits: [
      "Manutenzione e stabilità della skill Alexa"
    ]
  },
  {
    date: "8 Aprile 2026",
    version: "v1.2.0",
    commits: [
      "Potenziamento dell'integrazione smart home e comandi vocali",
      "Refactoring logica core dei servizi esterni"
    ]
  },
  {
    date: "26 Marzo 2026",
    version: "v1.1.2",
    commits: [
      "Implementazione widget di controllo per Android"
    ]
  },
  {
    date: "24 Marzo 2026",
    version: "v1.1.0",
    commits: [
      "Nuove animazioni interattive per la barra di navigazione",
      "Introduzione della modalità di visualizzazione a tema Vinile"
    ]
  },
  {
    date: "20 Marzo 2026",
    version: "v1.0.3",
    commits: [
      "Restyling della vista NowListening e gestione font dinamici",
      "Miglioramento dell'algoritmo di raccomandazione AI DJ"
    ]
  },
  {
    date: "19 Marzo 2026",
    version: "v1.0.2",
    commits: [
      "Aggiornamento sistema di overlay per gli Easter Egg"
    ]
  },
  {
    date: "18 Marzo 2026",
    version: "v1.0.1",
    commits: [
      "Revisione completa delle animazioni di sistema",
      "Miglioramento della Player Bar per desktop e mobile",
      "Espansione della collezione di segreti e easter egg"
    ]
  },
  {
    date: "17 Marzo 2026",
    version: "v1.0.0",
    commits: [
      "Setup iniziale dell'architettura Music Hub",
      "Integrazione base con Spotify Web API",
      "Configurazione del sistema di temi e layout core"
    ]
  }
];

export default function ChangelogContent() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <ScrollText className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            Changelog
          </h1>
          <p className="text-muted-foreground">
            Cronologia delle modifiche e degli aggiornamenti di Music Hub
          </p>
        </div>

        {/* Changelog Box */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {changelogData.map((entry, index) => (
                <div key={index} className="p-6 hover:bg-accent/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">
                          {entry.date}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold font-mono border border-primary/20">
                          {entry.version}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {entry.commits.map((commit, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-3 group">
                            <GitCommit className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                              {commit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-8">
          Music Hub v1.4.0 • Sviluppato con ❤️
        </p>
      </motion.div>
    </div>
  );
}
