const AUDD_TOKEN = import.meta.env.VITE_AUDD_API_TOKEN as string;

export interface RecognitionResult {
  title: string;
  artist: string;
  album: string;
  releaseDate?: string;
  lyrics?: string;
}

export async function recognizeWithAudD(audioBlob: Blob): Promise<RecognitionResult | null> {
  try {
    
    const formData = new FormData();
    formData.append('api_token', AUDD_TOKEN);
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('return', 'apple_music,spotify,lyrics');

    const response = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('[audd] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'success' || !data.result) {
      return null;
    }

    const result = data.result;
    
    return {
      title: result.title || '',
      artist: result.artist || '',
      album: result.album || '',
      releaseDate: result.release_date,
      lyrics: result.lyrics?.lyrics,
    };
  } catch (error) {
    console.error('[audd] Recognition error:', error);
    return null;
  }
}
