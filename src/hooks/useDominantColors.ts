import { useState, useEffect } from 'react';

interface DominantColors {
  primary: string;
  secondary: string;
  background: string;
}

/**
 * Estrae i colori dominanti da un'immagine
 */
export function useDominantColors(imageUrl: string | null | undefined): DominantColors | null {
  const [colors, setColors] = useState<DominantColors | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColors(null);
      return;
    }

    const extractColors = async () => {
      try {
        // Crea canvas per analizzare l'immagine
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return;

          // Ridimensiona per performance
          const size = 100;
          canvas.width = size;
          canvas.height = size;
          
          ctx.drawImage(img, 0, 0, size, size);
          
          const imageData = ctx.getImageData(0, 0, size, size).data;
          const colorMap: { [key: string]: number } = {};
          
          // Conta i colori
          for (let i = 0; i < imageData.length; i += 4) {
            const r = Math.floor(imageData[i] / 10) * 10;
            const g = Math.floor(imageData[i + 1] / 10) * 10;
            const b = Math.floor(imageData[i + 2] / 10) * 10;
            
            // Ignora colori troppo scuri o troppo chiari
            const brightness = (r + g + b) / 3;
            if (brightness < 30 || brightness > 240) continue;
            
            const key = `${r},${g},${b}`;
            colorMap[key] = (colorMap[key] || 0) + 1;
          }
          
          // Trova i colori più comuni
          const sortedColors = Object.entries(colorMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          
          if (sortedColors.length === 0) {
            setColors(null);
            return;
          }
          
          // Converti in HSL per meglio gestione
          const [r1, g1, b1] = sortedColors[0][0].split(',').map(Number);
          const hsl = rgbToHsl(r1, g1, b1);
          
          // Crea palette armoniosa
          setColors({
            primary: `hsl(${hsl.h}, ${Math.min(hsl.s + 10, 100)}%, ${Math.min(hsl.l + 10, 75)}%)`,
            secondary: `hsl(${(hsl.h + 30) % 360}, ${hsl.s}%, ${hsl.l}%)`,
            background: `hsl(${hsl.h}, ${Math.max(hsl.s - 20, 20)}%, ${Math.max(hsl.l - 40, 10)}%)`,
          });
        };
        
        img.onerror = () => {
          console.error('[colors] Failed to load image');
          setColors(null);
        };
        
        img.src = imageUrl;
      } catch (error) {
        console.error('[colors] Error extracting colors:', error);
        setColors(null);
      }
    };

    extractColors();
  }, [imageUrl]);

  return colors;
}

/**
 * Converte RGB in HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
