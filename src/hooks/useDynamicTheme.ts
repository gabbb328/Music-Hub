import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlaybackState } from '@/hooks/useSpotify';
import { extractColorsFromImage, applyColorPalette, clearColorPalette } from '@/services/color-extractor';

export function useDynamicTheme() {
  const { isDynamicTheme, autoDarkMode, setTheme, theme, effectiveTheme, setCoverImageUrl } = useTheme();
  const { data: playbackState } = usePlaybackState();
  const lastTrackRef  = useRef<string | null>(null);
  const lastThemeRef  = useRef<string | null>(null);

  useEffect(() => {
    const albumCover = playbackState?.item?.album?.images?.[0]?.url ?? null;
    const trackId    = playbackState?.item?.id ?? null;

    // Aggiorna sempre la copertina nel ThemeContext (per icona Auto)
    setCoverImageUrl(albumCover);

    if (!isDynamicTheme) {
      clearColorPalette();
      return;
    }

    if (!albumCover) {
      clearColorPalette();
      return;
    }

    if (lastTrackRef.current !== trackId) {
      lastTrackRef.current = null;
      lastThemeRef.current = null;
    }

    if (lastTrackRef.current === trackId && lastThemeRef.current === theme && trackId !== null) return;

    let cancelled = false;

    extractColorsFromImage(albumCover, effectiveTheme)
      .then(palette => {
        if (cancelled) return;
        if (autoDarkMode && palette.detectedTheme !== theme) {
          lastThemeRef.current = palette.detectedTheme;
          setTheme(palette.detectedTheme);
          setTimeout(() => {
            if (!cancelled) {
              applyColorPalette(palette, palette.detectedTheme);
              lastTrackRef.current = trackId;
            }
          }, 100);
        } else {
          applyColorPalette(palette, effectiveTheme);
          lastTrackRef.current = trackId;
          lastThemeRef.current = theme;
        }
      })
      .catch(err => console.error('[dynamic-theme]', err));

    return () => { cancelled = true; };
  }, [isDynamicTheme, playbackState?.item?.id, autoDarkMode, theme, effectiveTheme, setTheme, setCoverImageUrl]);

  return { isDynamicTheme };
}
