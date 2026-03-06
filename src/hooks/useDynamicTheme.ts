import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlaybackState } from '@/hooks/useSpotify';
import { extractColorsFromImage, applyColorPalette, clearColorPalette } from '@/services/color-extractor';

export function useDynamicTheme() {
  const { isDynamicTheme, autoDarkMode, setTheme, theme } = useTheme();
  const { data: playbackState } = usePlaybackState();
  const lastAppliedTrackRef = useRef<string | null>(null);
  const lastAppliedThemeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDynamicTheme) {
      clearColorPalette();
      return;
    }

    const albumCover = playbackState?.item?.album?.images?.[0]?.url;
    
    if (!albumCover) {
      clearColorPalette();
      return;
    }

    let cancelled = false;

    const trackId = playbackState?.item?.id;
    
    if (lastAppliedTrackRef.current !== trackId) {
      lastAppliedTrackRef.current = null;
      lastAppliedThemeRef.current = null;
    }
    
    if (lastAppliedTrackRef.current === trackId && 
        lastAppliedThemeRef.current === theme &&
        trackId !== null) {
      return;
    }

    extractColorsFromImage(albumCover)
      .then(palette => {
        if (!cancelled) {
          if (autoDarkMode && palette.detectedTheme !== theme) {
            lastAppliedThemeRef.current = palette.detectedTheme;
            setTheme(palette.detectedTheme);
            setTimeout(() => {
              if (!cancelled) {
                applyColorPalette(palette);
                lastAppliedTrackRef.current = trackId || null;
              }
            }, 100);
          } else {
            applyColorPalette(palette);
            lastAppliedTrackRef.current = trackId || null;
            lastAppliedThemeRef.current = theme;
          }
        }
      })
      .catch(err => {
        console.error('[dynamic-theme] Error extracting colors:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isDynamicTheme, playbackState?.item?.id, autoDarkMode, theme, setTheme]);

  return { isDynamicTheme };
}
