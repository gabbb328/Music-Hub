/**
 * Estrae i colori dominanti da un'immagine usando Canvas API
 */

interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  detectedTheme: 'light' | 'dark';
}

/**
 * Converte RGB a HSL per ordinare per luminosità
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Estrae colori dominanti dall'immagine
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        // Ridimensiona per performance
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Conta frequenza colori
        const colorCounts = new Map<string, number>();
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Ignora pixel trasparenti e troppo scuri/chiari
          if (a < 128) continue;
          const [, , l] = rgbToHsl(r, g, b);
          if (l < 10 || l > 90) continue;

          // Quantizza colori per raggruppare simili
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;

          colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }

        // Ordina per frequenza
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([rgb]) => {
            const [r, g, b] = rgb.split(',').map(Number);
            return { r, g, b };
          });

        if (sortedColors.length === 0) {
          // Fallback: colori default
          resolve({
            primary: 'rgb(168, 85, 247)',
            secondary: 'rgb(59, 130, 246)',
            background: 'rgb(17, 24, 39)',
            text: 'rgb(255, 255, 255)',
            detectedTheme: 'dark',
          });
          return;
        }

        // Colore primario (più frequente e saturato)
        const primary = sortedColors[0];
        const primaryHsl = rgbToHsl(primary.r, primary.g, primary.b);
        
        // Colore secondario (contrasto con primary)
        const secondary = sortedColors.find(c => {
          const hsl = rgbToHsl(c.r, c.g, c.b);
          const hueDiff = Math.abs(hsl[0] - primaryHsl[0]);
          return hueDiff > 30 && hueDiff < 180;
        }) || sortedColors[1] || primary;

        // Background: versione molto scura del primary
        const bgHsl = rgbToHsl(primary.r, primary.g, primary.b);
        const background = `hsl(${bgHsl[0]}, ${Math.min(bgHsl[1], 30)}%, 8%)`;

        // Determina se l'immagine è prevalentemente chiara o scura per auto-switch
        const avgLightness = sortedColors.reduce((sum, c) => {
          const [,, l] = rgbToHsl(c.r, c.g, c.b);
          return sum + l;
        }, 0) / sortedColors.length;
        
        const detectedTheme: 'light' | 'dark' = avgLightness > 50 ? 'light' : 'dark';

        resolve({
          primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
          secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`,
          background,
          text: primaryHsl[2] > 50 ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
          detectedTheme,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Applica palette colori al tema con transizioni smooth
 */
export function applyColorPalette(palette: ColorPalette) {
  const root = document.documentElement;
  
  // Aggiungi transizioni CSS per animazioni smooth
  root.style.transition = 'background-color 0.6s ease, color 0.6s ease';
  
  // Converti RGB in HSL per le varianti
  const primaryMatch = palette.primary.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (primaryMatch) {
    const [, r, g, b] = primaryMatch.map(Number);
    const [h, s, l] = rgbToHsl(r, g, b);
    
    root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--primary-foreground', palette.text);
  }

  const secondaryMatch = palette.secondary.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (secondaryMatch) {
    const [, r, g, b] = secondaryMatch.map(Number);
    const [h, s, l] = rgbToHsl(r, g, b);
    
    root.style.setProperty('--accent', `${h} ${s}% ${l}%`);
  }

  const bgMatch = palette.background.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/) ||
                  palette.background.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (bgMatch) {
    const [, v1, v2, v3] = bgMatch.map(Number);
    if (palette.background.startsWith('hsl')) {
      root.style.setProperty('--background', `${v1} ${v2}% ${v3}%`);
    } else {
      const [h, s, l] = rgbToHsl(v1, v2, v3);
      root.style.setProperty('--background', `${h} ${s}% ${l}%`);
    }
  }
  
  // Rimuovi transizione dopo l'animazione per non interferire con hover/interactions
  setTimeout(() => {
    root.style.transition = '';
  }, 600);
}

/**
 * Rimuovi palette personalizzata e ripristina tema
 */
export function clearColorPalette() {
  const root = document.documentElement;
  root.style.removeProperty('--primary');
  root.style.removeProperty('--primary-foreground');
  root.style.removeProperty('--accent');
  root.style.removeProperty('--background');
}
