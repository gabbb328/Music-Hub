/**
 * Song recognition usando ACRCloud API
 * Alternative gratuita e molto accurata
 * 100 richieste/giorno gratis
 */

const ACR_ACCESS_KEY = import.meta.env.VITE_ACR_ACCESS_KEY as string;
const ACR_ACCESS_SECRET = import.meta.env.VITE_ACR_ACCESS_SECRET as string;
const ACR_HOST = 'identify-eu-west-1.acrcloud.com';

export interface RecognitionResult {
  title: string;
  artist: string;
  album: string;
  releaseDate?: string;
  coverUrl?: string;
  duration?: number;
  isrc?: string;
}

/**
 * Genera signature per ACRCloud
 */
async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Riconosce canzone con ACRCloud (più affidabile di Shazam/AudD)
 */
export async function recognizeWithACRCloud(audioBlob: Blob): Promise<RecognitionResult | null> {
  try {
    if (!ACR_ACCESS_KEY || !ACR_ACCESS_SECRET) {
      return null;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `POST\n/v1/identify\n${ACR_ACCESS_KEY}\naudio\n1\n${timestamp}`;
    const signature = await generateSignature(stringToSign, ACR_ACCESS_SECRET);

    const formData = new FormData();
    formData.append('sample', audioBlob, 'audio.webm');
    formData.append('access_key', ACR_ACCESS_KEY);
    formData.append('data_type', 'audio');
    formData.append('signature_version', '1');
    formData.append('signature', signature);
    formData.append('sample_bytes', audioBlob.size.toString());
    formData.append('timestamp', timestamp.toString());

    const response = await fetch(`https://${ACR_HOST}/v1/identify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[acrcloud] HTTP error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (data.status?.code !== 0 || !data.metadata?.music?.[0]) {
      return null;
    }

    const track = data.metadata.music[0];
    
    return {
      title: track.title || '',
      artist: track.artists?.[0]?.name || '',
      album: track.album?.name || '',
      releaseDate: track.release_date,
      duration: track.duration_ms,
      isrc: track.external_ids?.isrc,
    };
  } catch (error) {
    console.error('[acrcloud] Recognition error:', error);
    return null;
  }
}

/**
 * Fallback chain: ACRCloud → Shazam → AudD
 */
export async function recognizeWithFallback(audioBlob: Blob): Promise<RecognitionResult | null> {
  // 1. Prova ACRCloud (più accurato)
  const acrResult = await recognizeWithACRCloud(audioBlob);
  
  if (acrResult) {
    return acrResult;
  }

  // 2. Prova Shazam
  try {
    const { recognizeWithShazam } = await import('./shazam-recognition');
    const shazamResult = await recognizeWithShazam(audioBlob);
    
    if (shazamResult) {
      return shazamResult;
    }
  } catch (error) {
    console.error('[recognize] Shazam error:', error);
  }

  // 3. Ultimo fallback: AudD
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
