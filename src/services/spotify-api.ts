import { getToken } from "./spotify-auth";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyApiOptions {
  method?: string;
  body?: any;
  headers?: any;
}

const spotifyFetch = async (endpoint: string, options: SpotifyApiOptions = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error("No token available. Please login to Spotify.");
  }

  try {
    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Check if response is ok
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        // Ignore parse errors
      }
      
      console.error(`Spotify API error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      } else if (response.status === 403) {
        throw new Error("Permission denied. Check your Spotify Premium status.");
      } else if (response.status === 404) {
        // 404 può significare "no active device" o "resource not found"
        if (endpoint.includes('/player/play')) {
          throw new Error("NO_ACTIVE_DEVICE");
        }
        throw new Error("Resource not found.");
      } else if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment.");
      }
      
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    // Try to parse JSON
    const text = await response.text();
    if (!text || text.trim() === '') return null;
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("Failed to parse JSON response:", text);
      return null;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error. Please check your connection.");
  }
};

// Player endpoints
export const getCurrentlyPlaying = () => 
  spotifyFetch("/me/player/currently-playing");

export const getPlaybackState = () => 
  spotifyFetch("/me/player");

export const play = async (deviceId?: string, contextUri?: string, uris?: string[]) => {
  const body: any = {};
  if (contextUri) body.context_uri = contextUri;
  if (uris) body.uris = uris;

  // Se non c'è deviceId, prova a trovarne uno
  if (!deviceId) {
    try {
      const devicesData = await getAvailableDevices();
      if (devicesData?.devices && devicesData.devices.length > 0) {
        // Trova device attivo o prendi il primo
        const activeDevice = devicesData.devices.find((d: any) => d.is_active);
        deviceId = activeDevice?.id || devicesData.devices[0].id;
        console.log("Using device:", deviceId);
      }
    } catch (err) {
      console.warn("Could not get devices, will try without deviceId");
    }
  }

  const query = deviceId ? `?device_id=${deviceId}` : "";
  
  try {
    const result = await spotifyFetch(`/me/player/play${query}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return result;
  } catch (error: any) {
    // Se fallisce con NO_ACTIVE_DEVICE e avevamo un deviceId, riprova senza
    if (error.message === "NO_ACTIVE_DEVICE" && deviceId) {
      console.warn("Retrying play without device_id");
      return await spotifyFetch(`/me/player/play`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }
    throw error;
  }
};

export const pause = async () => {
  try {
    return await spotifyFetch("/me/player/pause", { method: "PUT" });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE") {
      console.warn("No active device to pause");
      return null;
    }
    throw error;
  }
};

export const next = async () => {
  try {
    return await spotifyFetch("/me/player/next", { method: "POST" });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE") {
      console.warn("No active device for next track");
      return null;
    }
    throw error;
  }
};

export const previous = async () => {
  try {
    return await spotifyFetch("/me/player/previous", { method: "POST" });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE") {
      console.warn("No active device for previous track");
      return null;
    }
    throw error;
  }
};

export const seek = async (positionMs: number) => {
  try {
    return await spotifyFetch(`/me/player/seek?position_ms=${Math.floor(positionMs)}`, { method: "PUT" });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE") {
      console.warn("No active device to seek");
      return null;
    }
    throw error;
  }
};

export const setVolume = async (volumePercent: number) => {
  const volume = Math.max(0, Math.min(100, Math.floor(volumePercent)));
  try {
    return await spotifyFetch(`/me/player/volume?volume_percent=${volume}`, { method: "PUT" });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE") {
      console.warn("No active device to set volume");
      return null;
    }
    throw error;
  }
};

export const setShuffle = async (state: boolean) => {
  try {
    return await spotifyFetch(`/me/player/shuffle?state=${state}`, { method: "PUT" });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE") {
      console.warn("No active device for shuffle");
      return null;
    }
    throw error;
  }
};

export const setRepeat = async (state: "track" | "context" | "off") => {
  try {
    return await spotifyFetch(`/me/player/repeat?state=${state}`, { method: "PUT" });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE") {
      console.warn("No active device for repeat");
      return null;
    }
    throw error;
  }
};

export const transferPlayback = (deviceId: string, play: boolean = true) => 
  spotifyFetch("/me/player", {
    method: "PUT",
    body: JSON.stringify({ device_ids: [deviceId], play }),
  });

// Library endpoints
export const getRecentlyPlayed = (limit: number = 20) => 
  spotifyFetch(`/me/player/recently-played?limit=${limit}`);

export const getTopTracks = (timeRange: "short_term" | "medium_term" | "long_term" = "medium_term", limit: number = 20) => 
  spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);

export const getTopArtists = (timeRange: "short_term" | "medium_term" | "long_term" = "medium_term", limit: number = 20) => 
  spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);

export const getUserPlaylists = (limit: number = 50) => 
  spotifyFetch(`/me/playlists?limit=${limit}`);

export const getPlaylist = (playlistId: string) => 
  spotifyFetch(`/playlists/${playlistId}`);

export const getSavedTracks = (limit: number = 50) => 
  spotifyFetch(`/me/tracks?limit=${limit}`);

export const saveTrack = (trackId: string) => 
  spotifyFetch("/me/tracks", {
    method: "PUT",
    body: JSON.stringify({ ids: [trackId] }),
  });

export const removeTrack = (trackId: string) => 
  spotifyFetch("/me/tracks", {
    method: "DELETE",
    body: JSON.stringify({ ids: [trackId] }),
  });

export const checkSavedTracks = (trackIds: string[]) => 
  spotifyFetch(`/me/tracks/contains?ids=${trackIds.join(",")}`);

// Search endpoints
export const search = async (query: string, type: string[] = ["track", "artist", "album", "playlist"], limit: number = 20) => {
  // Validazione input
  if (!query || typeof query !== 'string') {
    return {
      tracks: { items: [] },
      artists: { items: [] },
      albums: { items: [] },
      playlists: { items: [] }
    };
  }
  
  const cleanQuery = query.trim();
  
  if (cleanQuery.length < 2) {
    return {
      tracks: { items: [] },
      artists: { items: [] },
      albums: { items: [] },
      playlists: { items: [] }
    };
  }
  
  try {
    const types = type.join(",");
    const result = await spotifyFetch(`/search?q=${encodeURIComponent(cleanQuery)}&type=${types}&limit=${limit}`);
    
    // Assicurati che il risultato abbia la struttura corretta
    return {
      tracks: result?.tracks || { items: [] },
      artists: result?.artists || { items: [] },
      albums: result?.albums || { items: [] },
      playlists: result?.playlists || { items: [] }
    };
  } catch (error) {
    console.error("Search error:", error);
    // Ritorna oggetto vuoto invece di lanciare errore
    return {
      tracks: { items: [] },
      artists: { items: [] },
      albums: { items: [] },
      playlists: { items: [] }
    };
  }
};

// Get user profile
export const getUserProfile = () => 
  spotifyFetch("/me");

// Get available devices
export const getAvailableDevices = () => 
  spotifyFetch("/me/player/devices");

// Get track audio features
export const getAudioFeatures = (trackId: string) => 
  spotifyFetch(`/audio-features/${trackId}`);

// Get recommendations
export const getRecommendations = (seedTracks?: string[], seedArtists?: string[], seedGenres?: string[]) => {
  const params = new URLSearchParams();
  if (seedTracks && seedTracks.length > 0) params.append("seed_tracks", seedTracks.join(","));
  if (seedArtists && seedArtists.length > 0) params.append("seed_artists", seedArtists.join(","));
  if (seedGenres && seedGenres.length > 0) params.append("seed_genres", seedGenres.join(","));
  
  return spotifyFetch(`/recommendations?${params.toString()}`);
};

export const getQueue = () => 
  spotifyFetch("/me/player/queue");

export const addToQueue = (uri: string) => 
  spotifyFetch(`/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: "POST" });
