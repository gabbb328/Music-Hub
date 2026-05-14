/**
 * trivia-api.ts
 * 
 * Servizio per recuperare curiosità e informazioni sui brani/artisti.
 */

export interface TriviaResult {
  title: string;
  extract: string;
  source: string;
}

export const fetchSongTrivia = async (artist: string, title: string): Promise<TriviaResult[]> => {
  try {
    // Cerchiamo prima l'artista su Wikipedia
    const response = await fetch(
      `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist.replace(/ /g, "_"))}`
    );
    
    if (!response.ok) throw new Error("Artist not found on Wikipedia");
    
    const data = await response.json();
    
    return [
      {
        title: `Curiosità su ${artist}`,
        extract: data.extract,
        source: "Wikipedia"
      }
    ];
  } catch (error) {
    console.error("[TriviaAPI] Errore nel recupero trivia:", error);
    return [
      {
        title: "Trivia non disponibile",
        extract: `Non abbiamo trovato curiosità specifiche per "${title}" di ${artist}.`,
        source: "System"
      }
    ];
  }
};
