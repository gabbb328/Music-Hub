/**
 * useEasterEgg — rileva parole chiave nella barra di ricerca e
 * restituisce l'effetto da mostrare.
 *
 * Easter eggs:
 *  "duh"        → riproduce il "duh" di Bad Guy (Billie Eilish) come testo animato
 *  "party"      → coriandoli colorati per 5 secondi
 *  "rainbow"    → sfondo arcobaleno animato
 *  "lgbt"       → bandiera LGBTQ+ come sfondo con messaggio
 *  "matrix"     → pioggia di codice verde stile Matrix
 *  "disco"      → palla da discoteca animata
 *  "nyan"       → Nyan Cat emoji che vola
 *  "hack"       → schermata hacker
 *  "love"       → cuori che piovono
 *  "🎵" o "music" → note musicali che fluttuano
 */

export type EasterEggType =
  | "duh"
  | "party"
  | "rainbow"
  | "lgbt"
  | "matrix"
  | "disco"
  | "nyan"
  | "hack"
  | "love"
  | "music"
  | null;

const TRIGGERS: Array<{ keywords: string[]; egg: EasterEggType }> = [
  { keywords: ["duh"],                        egg: "duh"     },
  { keywords: ["party", "festa", "confetti"], egg: "party"   },
  { keywords: ["rainbow", "arcobaleno"],      egg: "rainbow" },
  { keywords: ["lgbt", "pride", "gay"],       egg: "lgbt"    },
  { keywords: ["matrix"],                     egg: "matrix"  },
  { keywords: ["disco", "dance", "ballo"],    egg: "disco"   },
  { keywords: ["nyan", "nyancat"],            egg: "nyan"    },
  { keywords: ["hack", "hacker"],             egg: "hack"    },
  { keywords: ["love", "amore", "heart"],     egg: "love"    },
  { keywords: ["🎵", "music", "musica"],       egg: "music"   },
];

export function detectEasterEgg(query: string): EasterEggType {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const { keywords, egg } of TRIGGERS) {
    if (keywords.some(k => q === k || q.includes(k))) return egg;
  }
  return null;
}
