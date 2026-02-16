import { useEffect } from 'react';
import { usePlaybackState } from '@/hooks/useSpotify';
import { lyricsStore } from '@/hooks/useLyricsStore';
import { fetchSyncedLyrics } from '@/services/lyrics-api';
import { translateText } from '@/services/translation-api';

export function useLyricsPreloader() {
  const { data: playbackState } = usePlaybackState();
  
  useEffect(() => {
    const track = playbackState?.item;
    if (!track) return;

    const trackId = track.id;
    
    if (lyricsStore.getLyrics(trackId)) return;

    const loadLyrics = async () => {
      try {
        const { lines, synced } = await fetchSyncedLyrics(
          track.name,
          track.artists[0]?.name || '',
          Math.floor(track.duration_ms / 1000)
        );
        
        lyricsStore.setLyrics(trackId, { lines, synced });

        if (!lyricsStore.getTranslation(trackId) && lines.length > 0) {
          const translations = new Map<number, string>();
          
          for (let i = 0; i < Math.min(lines.length, 50); i++) {
            const line = lines[i];
            if (line.text.trim() && !line.text.includes('♪')) {
              const result = await translateText(line.text, 'it');
              if (result) {
                translations.set(i, result.translatedText);
              }
            }
            
            if (i % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          lyricsStore.setTranslation(trackId, translations);
        }
      } catch (error) {
        console.error('Lyrics preload error:', error);
      }
    };

    loadLyrics();
  }, [playbackState?.item?.id]);
}
