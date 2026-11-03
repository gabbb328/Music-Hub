import { useEffect, useRef } from 'react';
import { usePlaybackState } from '@/hooks/useSpotify';
import { lyricsStore } from '@/hooks/useLyricsStore';
import { fetchSyncedLyrics } from '@/services/lyrics-api';
import { translateText } from '@/services/translation-api';

export function useLyricsPreloader() {
  const { data: playbackState } = usePlaybackState();
  const lastPreloadIdRef = useRef<string | null>(null);

  useEffect(() => {
    const track = playbackState?.item;
    if (!track) return;

    const trackId = track.id;
    if (lastPreloadIdRef.current === trackId) return;
    lastPreloadIdRef.current = trackId;

    if (lyricsStore.hasLyrics(trackId)) return;

    const loadLyrics = async () => {
      try {
        const { lines, synced } = await fetchSyncedLyrics(
          track.name,
          track.artists[0]?.name || '',
          Math.floor(track.duration_ms / 1000)
        );

        lyricsStore.setLyrics(trackId, { lines: lines || [], synced: !!synced });

        if (!lyricsStore.getTranslation(trackId) && lines && lines.length > 0) {
          const validLines = lines
            .map((l, idx) => ({ text: l.text.trim(), idx }))
            .filter((l) => l.text && !l.text.includes('♪'))
            .slice(0, 30);

          if (validLines.length > 0) {
            const combined = validLines.map((l) => l.text).join('\n');
            const result = await translateText(combined, 'it');
            if (result?.translatedText) {
              const split = result.translatedText.split('\n');
              const translations = new Map<number, string>();
              validLines.forEach((item, i) => {
                translations.set(item.idx, split[i]?.trim() || item.text);
              });
              lyricsStore.setTranslation(trackId, translations);
            }
          }
        }
      } catch (error) {
        lyricsStore.setLyrics(trackId, { lines: [], synced: false });
      }
    };

    loadLyrics();
  }, [playbackState?.item?.id]);
}
