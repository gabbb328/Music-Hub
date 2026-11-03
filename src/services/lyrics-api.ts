// Multi-source Lyrics API with fallbacks
const LYRICS_OVH_BASE = "https://api.lyrics.ovh/v1";
const LRCLIB_BASE = "https://lrclib.net/api";

// Rate limiting & in-memory cache to completely stop redundant / loop requests
let lrclibCooldownUntil = 0;
const lyricsMemoryCache = new Map<string, { data: SyncedLyrics; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<SyncedLyrics>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti

export interface LyricWord {
  time: number;
  text: string;
}

export interface LyricLine {
  time: number;
  text: string;
  endTime?: number;
  words?: LyricWord[];
}

export interface SyncedLyrics {
  lines: LyricLine[];
  synced: boolean;
  source: string;
}

export interface FormattedWordPart {
  leadPunct: string;
  word: string;
  trailPunct: string;
  isPunctOnly: boolean;
  isHigh: boolean;
  isLow: boolean;
  isVib: boolean;
  isChorus: boolean;
  rawText: string;
  index: number;
}

export const detectHighPitch = (word: string): boolean => {
  const w = word.replace(/[^a-zA-Z]/g, "");
  if (w.length < 2) return false;
  return w === w.toUpperCase() || word.includes("!");
};

export const detectLowPitch = (word: string): boolean => {
  return /[…]$/.test(word) || /\*/.test(word) || word.startsWith("~");
};

export const detectVibrato = (word: string): boolean => {
  return /([aeiouy])\1{2,}/i.test(word);
};

export function parseWordParts(
  rawText: string,
  index: number = 0,
  isChorus: boolean = false
): FormattedWordPart {
  const trimmed = rawText.trim();
  // Isola simboli e punteggiatura iniziale, parola alfabetica/numerica (incluso apostrofo o trattino interno), e punteggiatura finale (, ; . : - _)
  const match = trimmed.match(/^([^\p{L}\p{N}]+)?([\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*)?([^\p{L}\p{N}]+)?$/u);

  let leadPunct = "";
  let coreWord = "";
  let trailPunct = "";
  let isPunctOnly = false;

  if (match && match[2]) {
    leadPunct = match[1] || "";
    coreWord = match[2];
    trailPunct = match[3] || "";
    isPunctOnly = false;
  } else {
    leadPunct = "";
    coreWord = trimmed;
    trailPunct = "";
    isPunctOnly = true;
  }

  return {
    leadPunct,
    word: coreWord,
    trailPunct,
    isPunctOnly,
    isHigh: detectHighPitch(coreWord),
    isLow: detectLowPitch(coreWord),
    isVib: detectVibrato(coreWord),
    isChorus,
    rawText: trimmed,
    index,
  };
}

// Clean and normalize text for better matching
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Parse LRC format
export const parseLRC = (lrcContent: string): LyricLine[] => {
  if (!lrcContent || typeof lrcContent !== 'string') {
    return [];
  }

  const lines: LyricLine[] = [];
  const lrcLines = lrcContent.split('\n');

  // Leggi eventuale tag offset [offset: +/-ms] (standard formato LRC)
  const offsetMatch = lrcContent.match(/\[offset:\s*([+-]?\d+)\s*\]/i);
  const offsetMs = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;
  const offsetSec = offsetMs / 1000;
  
  for (const line of lrcLines) {
    try {
      // Find all line-level timestamp tags like [01:23.45]
      const timeRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{1,3}))?\]/g;
      const timeMatches = [...line.matchAll(timeRegex)];
      
      if (timeMatches.length > 0) {
        // Remove the line-level timestamps to get the text
        let rawText = line.replace(timeRegex, '').trim();

        // Standardizza i cori / backing vocals: converti [Coro: ...], [Backing: ...], [Backing Vocals: ...] o parentesi quadre in parentesi tonde ()
        rawText = rawText
          .replace(/\[(?:backing(?:\s*vocals?)?|coro|vocals?|harmonies?|chorus)\s*:\s*([^\]]+)\]/gi, '($1)')
          .replace(/\[([^[\]]+)\]/g, (match, inner) => {
            if (/^(instrumental|musica|solo|guitar solo|intro|outro|break|drop|interlude)$/i.test(inner.trim())) {
              return `[${inner.trim()}]`;
            }
            return `(${inner.trim()})`;
          });
        
        let words: LyricWord[] | undefined = undefined;
        // Parse enhanced LRC word-level timestamps like <01:23.45> Word
        const wordRegex = /<(\d{2,}):(\d{2})(?:\.(\d{1,3}))?>([^<]*)/g;
        const wordMatches = [...rawText.matchAll(wordRegex)];
        
        let cleanText = rawText;
        if (wordMatches.length > 0) {
          words = [];
          for (const wm of wordMatches) {
            const wmMin = parseInt(wm[1], 10);
            const wmSec = parseInt(wm[2], 10);
            const wmMilli = wm[3] ? parseInt(wm[3].padEnd(3, '0'), 10) : 0;
            const wTime = Math.max(0, wmMin * 60 + wmSec + wmMilli / 1000 + offsetSec);
            const wText = wm[4].trim();
            if (wText) {
              words.push({ time: wTime, text: wText });
            }
          }
          cleanText = rawText.replace(/<\d{2,}:\d{2}(?:\.\d{1,3})?>/g, '').trim();
          if (words.length === 0) words = undefined;
        } else {
          // Just clean any stray tags if they exist
          cleanText = rawText.replace(/<\d{2,}:\d{2}(?:\.\d{1,3})?>/g, '').trim();
        }
        
        for (const match of timeMatches) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
          
          if (!isNaN(minutes) && !isNaN(seconds)) {
            const time = Math.max(0, minutes * 60 + seconds + milliseconds / 1000 + offsetSec);
            lines.push({ time, text: cleanText, words });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse LRC line:', line, e);
      continue;
    }
  }
  
  lines.sort((a, b) => a.time - b.time);
  for (let i = 0; i < lines.length - 1; i++) {
    lines[i].endTime = lines[i + 1].time;
  }
  if (lines.length > 0) {
    lines[lines.length - 1].endTime = lines[lines.length - 1].time + 5;
  }
  
  return lines;
};

// Generate pseudo-synced lyrics
export const generatePseudoSyncedLyrics = (lyrics: string, duration: number): LyricLine[] => {
  if (!lyrics || typeof lyrics !== 'string' || !duration || duration <= 0) {
    return [];
  }

  try {
    const lines = lyrics.split('\n').filter(line => line && line.trim());
    if (lines.length === 0) return [];
    
    const timePerLine = Math.max(1, duration / lines.length);
    
    return lines.map((text, index) => ({
      time: index * timePerLine,
      text: text.trim(),
      endTime: (index + 1) * timePerLine
    }));
  } catch (e) {
    console.error('Failed to generate pseudo-synced lyrics:', e);
    return [];
  }
};

// Fetch from LRCLIB.net (has time-synced lyrics)
const fetchFromLRCLIB = async (title: string, artist: string, duration: number): Promise<SyncedLyrics | null> => {
  if (Date.now() < lrclibCooldownUntil) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
      duration: Math.floor(duration).toString()
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${LRCLIB_BASE}/get?${params.toString()}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        lrclibCooldownUntil = Date.now() + 60_000; // 1 minuto di cooldown
      }
      return null;
    }

    const data = await response.json();

    // Try synced lyrics first
    if (data.syncedLyrics) {
      const lines = parseLRC(data.syncedLyrics);
      if (lines.length > 0) {
        return { lines, synced: true, source: 'lrclib' };
      }
    }

    // Fallback to plain lyrics
    if (data.plainLyrics) {
      const lines = generatePseudoSyncedLyrics(data.plainLyrics, duration);
      if (lines.length > 0) {
        return { lines, synced: false, source: 'lrclib' };
      }
    }

    return null;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.warn('LRCLIB fetch error:', error);
    }
    return null;
  }
};

// Fetch from Lyrics.ovh
const fetchFromLyricsOvh = async (title: string, artist: string, duration: number): Promise<SyncedLyrics | null> => {
  try {
    const cleanArtist = artist.trim();
    const cleanTitle = title.trim();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      `${LYRICS_OVH_BASE}/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const lyricsText = data?.lyrics;
    
    if (!lyricsText || typeof lyricsText !== 'string') {
      return null;
    }
    
    // Check if LRC format
    if (lyricsText.includes('[') && lyricsText.match(/\[\d{2}:\d{2}/)) {
      const lines = parseLRC(lyricsText);
      if (lines.length > 0) {
        return { lines, synced: true, source: 'lyrics.ovh' };
      }
    }
    
    // Generate pseudo-sync
    const lines = generatePseudoSyncedLyrics(lyricsText, duration);
    if (lines.length > 0) {
      return { lines, synced: false, source: 'lyrics.ovh' };
    }

    return null;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.warn('Lyrics.ovh fetch error:', error);
    }
    return null;
  }
};

// Try searching with variations
const searchVariations = async (
  title: string, 
  artist: string, 
  duration: number,
  fetchFn: (t: string, a: string, d: number) => Promise<SyncedLyrics | null>
): Promise<SyncedLyrics | null> => {
  // Try exact match first
  let result = await fetchFn(title, artist, duration);
  if (result) return result;
  // Se LRCLIB ha risposto con 429 o 503, interrompi subito le altre varianti per non spammare
  if (Date.now() < lrclibCooldownUntil) return null;

  // Try without featuring artists
  const titleWithoutFeat = title.replace(/\s*[\(\[].*?feat.*?[\)\]]/gi, '').trim();
  if (titleWithoutFeat !== title) {
    result = await fetchFn(titleWithoutFeat, artist, duration);
    if (result) return result;
    if (Date.now() < lrclibCooldownUntil) return null;
  }

  // Try first artist only
  const firstArtist = artist.split(/[,&]|feat/i)[0].trim();
  if (firstArtist !== artist) {
    result = await fetchFn(title, firstArtist, duration);
    if (result) return result;
    if (Date.now() < lrclibCooldownUntil) return null;

    if (titleWithoutFeat !== title) {
      result = await fetchFn(titleWithoutFeat, firstArtist, duration);
      if (result) return result;
      if (Date.now() < lrclibCooldownUntil) return null;
    }
  }

  // Try without parentheses content
  const titleWithoutParens = title.replace(/\s*\([^)]*\)/g, '').trim();
  if (titleWithoutParens !== title) {
    result = await fetchFn(titleWithoutParens, artist, duration);
    if (result) return result;
    if (Date.now() < lrclibCooldownUntil) return null;

    result = await fetchFn(titleWithoutParens, firstArtist, duration);
    if (result) return result;
  }

  return null;
};

// Fetch from LRCLIB.net Search Endpoint (when exact /get returns null)
const fetchFromLRCLIBSearch = async (title: string, artist: string, duration: number): Promise<SyncedLyrics | null> => {
  if (Date.now() < lrclibCooldownUntil) {
    return null;
  }

  try {
    const cleanTitle = title.replace(/\s*[\(\[].*?[\)\]]/gi, '').trim();
    const cleanArtist = artist.split(/[,&]|feat/i)[0].trim();
    const query = `${cleanArtist} ${cleanTitle}`.trim();

    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let response = await fetch(`${LRCLIB_BASE}/search?${params.toString()}`, {
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        lrclibCooldownUntil = Date.now() + 60_000;
        clearTimeout(timeoutId);
        return null;
      }
      response = await fetch(`${LRCLIB_BASE}/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        lrclibCooldownUntil = Date.now() + 60_000;
      }
      return null;
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    // Pick best match (syncedLyrics preferred)
    const syncedMatch = results.find((r: any) => r.syncedLyrics && r.syncedLyrics.length > 20);
    if (syncedMatch && syncedMatch.syncedLyrics) {
      const lines = parseLRC(syncedMatch.syncedLyrics);
      if (lines.length > 0) {
        return { lines, synced: true, source: 'lrclib-search' };
      }
    }

    const plainMatch = results.find((r: any) => r.plainLyrics && r.plainLyrics.length > 20);
    if (plainMatch && plainMatch.plainLyrics) {
      const lines = generatePseudoSyncedLyrics(plainMatch.plainLyrics, duration);
      if (lines.length > 0) {
        return { lines, synced: false, source: 'lrclib-search' };
      }
    }

    return null;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.warn('LRCLIB search error:', error);
    }
    return null;
  }
};

// Main fetch function with multiple sources, memory cache and in-flight deduplication
export const fetchSyncedLyrics = async (
  title: string, 
  artist: string,
  duration: number
): Promise<SyncedLyrics> => {
  if (!title || !artist) {
    return { 
      lines: [], 
      synced: false,
      source: 'none'
    };
  }

  const cacheKey = `${normalizeText(title)}_${normalizeText(artist)}_${Math.floor(duration)}`;

  // 1. Controlla la cache in memoria (valida per 5 minuti)
  const cached = lyricsMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Se c'è già una richiesta in corso per questo brano, unisciti ad essa (Deduplicazione)
  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const executeFetch = async (): Promise<SyncedLyrics> => {
    try {
      // 1. Tenta LRCLIB direct get con tutte le varianti di titolo/artista
      if (Date.now() >= lrclibCooldownUntil) {
        let result = await searchVariations(title, artist, duration, fetchFromLRCLIB);
        if (result && result.lines.length >= 2 && result.synced) {
          return result;
        }

        // 2. Tenta LRCLIB search (cerca con query full-text artista + brano)
        if (Date.now() >= lrclibCooldownUntil) {
          result = await searchVariations(title, artist, duration, fetchFromLRCLIBSearch);
          if (result && result.lines.length >= 2 && result.synced) {
            return result;
          }
        }

        // 3. Tenta ricerca globale solo titolo su LRCLIB
        if (Date.now() >= lrclibCooldownUntil) {
          const cleanTitleOnly = title.replace(/\s*[\(\[].*?[\)\]]/gi, '').trim();
          if (cleanTitleOnly && cleanTitleOnly.length > 2) {
            result = await fetchFromLRCLIBSearch(cleanTitleOnly, "", duration);
            if (result && result.lines.length >= 2 && result.synced) {
              return result;
            }
          }
        }
      }

      // 4. Tenta Lyrics.ovh (API alternativa con testi internazionali)
      let result = await searchVariations(title, artist, duration, fetchFromLyricsOvh);
      if (result && result.lines.length >= 2) {
        return result;
      }

      // 5. Se trovati testi plain non sincronizzati da LRCLIB, usali solo come ultima spiaggia
      if (Date.now() >= lrclibCooldownUntil) {
        const plainFallback = await fetchFromLRCLIBSearch(title, artist, duration);
        if (plainFallback && plainFallback.lines.length >= 2) {
          return plainFallback;
        }
      }
    } catch (error) {
      console.error('Lyrics fetch error:', error);
    }

    return {
      lines: [],
      synced: false,
      source: 'none'
    };
  };

  const promise = executeFetch().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  const finalResult = await promise;
  lyricsMemoryCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
  return finalResult;
};

// Get current line index
export const getCurrentLineIndex = (lines: LyricLine[], currentTime: number): number => {
  if (!lines || lines.length === 0 || typeof currentTime !== 'number') {
    return 0;
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentTime >= lines[i].time) {
      return i;
    }
  }
  return 0;
};

// Get display lines
export const getDisplayLines = (
  lines: LyricLine[], 
  currentIndex: number, 
  contextBefore: number = 2,
  contextAfter: number = 3
): { line: LyricLine; index: number; isCurrent: boolean; isPast: boolean; isFuture: boolean }[] => {
  if (!lines || lines.length === 0) {
    return [];
  }

  const safeIndex = Math.max(0, Math.min(currentIndex, lines.length - 1));
  const start = Math.max(0, safeIndex - contextBefore);
  const end = Math.min(lines.length, safeIndex + contextAfter + 1);
  
  return lines.slice(start, end).map((line, i) => {
    const actualIndex = start + i;
    return {
      line,
      index: actualIndex,
      isCurrent: actualIndex === safeIndex,
      isPast: actualIndex < safeIndex,
      isFuture: actualIndex > safeIndex
    };
  });
};
