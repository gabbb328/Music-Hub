// Multi-source Lyrics API with fallbacks
const LYRICS_OVH_BASE = "https://api.lyrics.ovh/v1";
const LRCLIB_BASE = "https://lrclib.net/api";

export interface LyricLine {
  time: number;
  text: string;
  endTime?: number;
}

export interface SyncedLyrics {
  lines: LyricLine[];
  synced: boolean;
  source: string;
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
  
  for (const line of lrcLines) {
    try {
      const match = line.match(/\[(\d{2}):(\d{2})\.?(\d{2})?\](.*)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centiseconds = match[3] ? parseInt(match[3], 10) : 0;
        const text = match[4]?.trim() || '';
        
        if (text && !isNaN(minutes) && !isNaN(seconds)) {
          const time = minutes * 60 + seconds + centiseconds / 100;
          lines.push({ time, text });
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
  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
      duration: Math.floor(duration).toString()
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${LRCLIB_BASE}/get?${params.toString()}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
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

  // Try without featuring artists
  const titleWithoutFeat = title.replace(/\s*[\(\[].*?feat.*?[\)\]]/gi, '').trim();
  if (titleWithoutFeat !== title) {
    result = await fetchFn(titleWithoutFeat, artist, duration);
    if (result) return result;
  }

  // Try first artist only
  const firstArtist = artist.split(/[,&]|feat/i)[0].trim();
  if (firstArtist !== artist) {
    result = await fetchFn(title, firstArtist, duration);
    if (result) return result;

    if (titleWithoutFeat !== title) {
      result = await fetchFn(titleWithoutFeat, firstArtist, duration);
      if (result) return result;
    }
  }

  // Try without parentheses content
  const titleWithoutParens = title.replace(/\s*\([^)]*\)/g, '').trim();
  if (titleWithoutParens !== title) {
    result = await fetchFn(titleWithoutParens, artist, duration);
    if (result) return result;

    result = await fetchFn(titleWithoutParens, firstArtist, duration);
    if (result) return result;
  }

  return null;
};

// Main fetch function with multiple sources
export const fetchSyncedLyrics = async (
  title: string, 
  artist: string,
  duration: number
): Promise<SyncedLyrics> => {
  // Validation
  if (!title || !artist || !duration) {
    console.warn('Invalid params for lyrics fetch:', { title, artist, duration });
    return { 
      lines: generatePlaceholderLyrics(title || 'Unknown', duration || 180), 
      synced: false,
      source: 'placeholder'
    };
  }

  try {
    // Try LRCLIB first (best for synced lyrics)
    console.log('Trying LRCLIB...');
    let result = await searchVariations(title, artist, duration, fetchFromLRCLIB);
    if (result && result.lines.length > 5) { // Minimum 5 lines
      console.log('✓ Found lyrics on LRCLIB');
      return result;
    }

    // Try Lyrics.ovh
    console.log('Trying Lyrics.ovh...');
    result = await searchVariations(title, artist, duration, fetchFromLyricsOvh);
    if (result && result.lines.length > 5) {
      console.log('✓ Found lyrics on Lyrics.ovh');
      return result;
    }

    console.log('✗ No lyrics found');
  } catch (error) {
    console.error('Lyrics fetch error:', error);
  }
  
  return {
    lines: generatePlaceholderLyrics(title, duration),
    synced: false,
    source: 'placeholder'
  };
};

// Generate placeholder lyrics
const generatePlaceholderLyrics = (title: string, duration: number): LyricLine[] => {
  const placeholderLines = [
    `♪ ${title} ♪`,
    '',
    'Lyrics not available for this track',
    '',
    'Try searching on Genius.com or AZLyrics',
    '',
    'Enjoying the instrumental version...',
    '',
    '🎵'
  ];
  
  const safeDuration = Math.max(30, duration);
  const timePerLine = safeDuration / placeholderLines.length;
  
  return placeholderLines.map((text, index) => ({
    time: index * timePerLine,
    text,
    endTime: (index + 1) * timePerLine
  }));
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
