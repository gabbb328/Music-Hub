/**
 * Song recognition usando Shazam API (RapidAPI)
 * Piano gratuito: 500 richieste/mese
 * Più accurato e affidabile di AudD.io
 */

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string;
const RAPIDAPI_HOST = 'shazam.p.rapidapi.com';

export interface RecognitionResult {
  title: string;
  artist: string;
  album: string;
  releaseDate?: string;
  coverUrl?: string;
  genres?: string[];
  shazamUrl?: string;
}

/**
 * Riconosce una canzone da un blob audio usando Shazam
 */
export async function recognizeWithShazam(audioBlob: Blob): Promise<RecognitionResult | null> {
  try {
    
    // Shazam accetta base64
    const base64Audio = await blobToBase64(audioBlob);
    
    const response = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      body: base64Audio,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[shazam] HTTP error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (!data.track) {
      return null;
    }

    const track = data.track;
    
    return {
      title: track.title || '',
      artist: track.subtitle || '',
      album: track.sections?.find((s: any) => s.type === 'SONG')?.metadata?.find((m: any) => m.title === 'Album')?.text || '',
      releaseDate: track.sections?.find((s: any) => s.type === 'SONG')?.metadata?.find((m: any) => m.title === 'Released')?.text,
      coverUrl: track.images?.coverart || track.images?.background,
      genres: track.genres?.primary ? [track.genres.primary] : undefined,
      shazamUrl: track.url,
    };
  } catch (error) {
    console.error('[shazam] Recognition error:', error);
    return null;
  }
}

/**
 * Converte Blob in base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Fallback: prova prima Shazam, poi AudD se fallisce
 */
export async function recognizeWithShazamFallback(audioBlob: Blob): Promise<RecognitionResult | null> {
  // Prova prima Shazam (più accurato)
  const shazamResult = await recognizeWithShazam(audioBlob);
  
  if (shazamResult) {
    return shazamResult;
  }

  // Se Shazam fallisce, prova AudD
  try {
    const { recognizeWithAudD } = await import('./song-recognition');
    const auddResult = await recognizeWithAudD(audioBlob);
    
    if (auddResult) {
      return auddResult;
    }
  } catch (error) {
    console.error('[recognize] AudD error:', error);
  }

  return null;
}
