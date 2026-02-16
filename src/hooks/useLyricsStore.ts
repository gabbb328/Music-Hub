interface LyricLine {
  time: number;
  text: string;
}

class LyricsStore {
  private currentLyrics: Map<string, { lines: LyricLine[]; synced: boolean }> = new Map();
  private currentTranslations: Map<string, Map<number, string>> = new Map();

  setLyrics(trackId: string, lyrics: { lines: LyricLine[]; synced: boolean }) {
    this.currentLyrics.set(trackId, lyrics);
  }

  setTranslation(trackId: string, translations: Map<number, string>) {
    this.currentTranslations.set(trackId, translations);
  }

  getLyrics(trackId: string): { lines: LyricLine[]; synced: boolean } | null {
    return this.currentLyrics.get(trackId) || null;
  }

  getTranslation(trackId: string): Map<number, string> | null {
    return this.currentTranslations.get(trackId) || null;
  }

  clear() {
    this.currentLyrics.clear();
    this.currentTranslations.clear();
  }
}

export const lyricsStore = new LyricsStore();
