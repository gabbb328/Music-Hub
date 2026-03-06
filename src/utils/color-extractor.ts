/**
 * Estrae i colori dominanti da un'immagine
 */

interface ColorPalette {
  primary: string;
  background: string;
  vibrant: string;
}

/**
 * Estrae colori da un'immagine usando Canvas API
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Ridimensiona per performance
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Raccogli tutti i colori
        const colorMap = new Map<string, number>();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Ignora pixel trasparenti e troppo chiari/scuri
          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness < 20 || brightness > 235) continue;

          const key = `${Math.round(r / 10)},${Math.round(g / 10)},${Math.round(b / 10)}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Converti in array e ordina per frequenza
        const sortedColors = Array.from(colorMap.entries())
          .map(([key, count]) => {
            const [r, g, b] = key.split(',').map(n => parseInt(n) * 10);
            return { r, g, b, count };
          })
          .sort((a, b) => b.count - a.count);

        if (sortedColors.length === 0) {
          // Fallback: blu
          resolve({
            primary: 'hsl(217, 91%, 60%)',
            background: 'hsl(217, 30%, 15%)',
            vibrant: 'hsl(217, 91%, 70%)'
          });
          return;
        }

        // Prendi il colore più comune
        const dominant = sortedColors[0];
        
        // Trova colore vibrante (alta saturazione)
        const vibrant = sortedColors.find(c => {
          const saturation = calculateSaturation(c.r, c.g, c.b);
          return saturation > 0.3;
        }) || dominant;

        const primaryHsl = rgbToHsl(dominant.r, dominant.g, dominant.b);
        const vibrantHsl = rgbToHsl(vibrant.r, vibrant.g, vibrant.b);

        resolve({
          primary: `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 100, 91)}%, ${Math.min(Math.max(primaryHsl.l * 100, 50), 70)}%)`,
          background: `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 100 * 0.4, 30)}%, 12%)`,
          vibrant: `hsl(${vibrantHsl.h}, ${Math.min(vibrantHsl.s * 100, 91)}%, ${Math.min(Math.max(vibrantHsl.l * 100, 60), 75)}%)`
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

function calculateSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  if (max === 0) return 0;
  return delta / max;
}

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
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s,
    l
  };
}
