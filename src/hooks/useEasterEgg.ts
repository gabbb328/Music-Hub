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
