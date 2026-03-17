import { getToken } from "./spotify-auth";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyApiOptions {
  method?: string;
  body?: any;
  headers?: any;
}

const spotifyFetch = async (endpoint: string, options: SpotifyApiOptions = {}) => {
  const token = getToken();
  if (!token) throw new Error("No token available. Please login to Spotify.");

  try {
    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorText = "";
      try { errorText = await response.text(); } catch (e) {}
      console.error(`Spotify API error (${response.status}):`, errorText);
      if (response.status === 401) throw new Error("Authentication failed. Please login again.");
      else if (response.status === 403) throw new Error("Permission denied. Check your Spotify Premium status.");
      else if (response.status === 404) {
        if (endpoint.includes('/player/play')) throw new Error("NO_ACTIVE_DEVICE");
        throw new Error("Resource not found.");
      } else if (response.status === 429) throw new Error("Too many requests. Please wait a moment.");
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') return null;
    const text = await response.text();
    if (!text || text.trim() === '') return null;
    try { return JSON.parse(text); } catch (e) { return null; }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Network error. Please check your connection.");
  }
};

const fetchAllPages = async (endpoint: string, limit: number = 50): Promise<any[]> => {
  const allItems: any[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const data = await spotifyFetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`);
    if (!data || !data.items) break;
    allItems.push(...data.items);
    if (data.items.length < limit || !data.next) hasMore = false;
    else offset += limit;
  }
  return allItems;
};

// ── Player ────────────────────────────────────────────────────────────────────
export const getCurrentlyPlaying = () => spotifyFetch("/me/player/currently-playing");
export const getPlaybackState = () => spotifyFetch("/me/player");

export const play = async (deviceId?: string, contextUri?: string, uris?: string[]) => {
  const body: any = {};
  if (contextUri) body.context_uri = contextUri;
  if (uris) body.uris = uris;
  if (!deviceId) {
    try {
      const devicesData = await getAvailableDevices();
      if (devicesData?.devices?.length > 0) {
        const active = devicesData.devices.find((d: any) => d.is_active);
        deviceId = active?.id || devicesData.devices[0].id;
      }
    } catch (_) {}
  }
  const query = deviceId ? `?device_id=${deviceId}` : "";
  try {
    return await spotifyFetch(`/me/player/play${query}`, { method: "PUT", body: JSON.stringify(body) });
  } catch (error: any) {
    if (error.message === "NO_ACTIVE_DEVICE" && deviceId)
      return await spotifyFetch(`/me/player/play`, { method: "PUT", body: JSON.stringify(body) });
    throw error;
  }
};

export const pause    = async () => { try { return await spotifyFetch("/me/player/pause", { method: "PUT" }); } catch { return null; } };
export const next     = async () => { try { return await spotifyFetch("/me/player/next", { method: "POST" }); } catch { return null; } };
export const previous = async () => { try { return await spotifyFetch("/me/player/previous", { method: "POST" }); } catch { return null; } };
export const seek     = async (positionMs: number) => { try { return await spotifyFetch(`/me/player/seek?position_ms=${Math.floor(positionMs)}`, { method: "PUT" }); } catch { return null; } };
export const setVolume = async (v: number) => { try { return await spotifyFetch(`/me/player/volume?volume_percent=${Math.max(0,Math.min(100,Math.floor(v)))}`, { method: "PUT" }); } catch { return null; } };
export const setShuffle = async (state: boolean) => { try { return await spotifyFetch(`/me/player/shuffle?state=${state}`, { method: "PUT" }); } catch { return null; } };
export const setRepeat  = async (state: "track"|"context"|"off") => { try { return await spotifyFetch(`/me/player/repeat?state=${state}`, { method: "PUT" }); } catch { return null; } };
export const transferPlayback = (deviceId: string, play: boolean = true) =>
  spotifyFetch("/me/player", { method: "PUT", body: JSON.stringify({ device_ids: [deviceId], play }) });

// ── Library ───────────────────────────────────────────────────────────────────
export const getRecentlyPlayed  = (limit = 20) => spotifyFetch(`/me/player/recently-played?limit=${limit}`);
export const getTopTracks       = (timeRange: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 20) => spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
export const getTopArtists      = (timeRange: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 20) => spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
export const getUserPlaylists   = async (): Promise<{ items: any[] }> => ({ items: await fetchAllPages("/me/playlists", 50) });
export const getPlaylist        = (id: string) => spotifyFetch(`/playlists/${id}`);
export const getAllPlaylistTracks = async (playlistId: string): Promise<any[]> => {
  const all: any[] = []; let offset = 0; let hasMore = true;
  while (hasMore) {
    const d = await spotifyFetch(`/playlists/${playlistId}/tracks?limit=100&offset=${offset}`);
    if (!d?.items) break; all.push(...d.items);
    if (d.items.length < 100 || !d.next) hasMore = false; else offset += 100;
  }
  return all;
};
export const getSavedTracks = async (limit?: number): Promise<{ items: any[]; total: number }> => {
  if (limit) { const d = await spotifyFetch(`/me/tracks?limit=${limit}`); return d || { items: [], total: 0 }; }
  const all = await fetchAllPages("/me/tracks", 50);
  return { items: all, total: all.length };
};
export const saveTrack          = (id: string) => spotifyFetch("/me/tracks", { method: "PUT", body: JSON.stringify({ ids: [id] }) });
export const removeTrack        = (id: string) => spotifyFetch("/me/tracks", { method: "DELETE", body: JSON.stringify({ ids: [id] }) });
export const checkSavedTracks   = (ids: string[]) => spotifyFetch(`/me/tracks/contains?ids=${ids.join(",")}`);

// ── Search ────────────────────────────────────────────────────────────────────
export const search = async (query: string, type: string[] = ["track","artist","album","playlist"], limit = 20) => {
  const clean = query?.trim() || "";
  if (clean.length < 2) return { tracks:{items:[]}, artists:{items:[]}, albums:{items:[]}, playlists:{items:[]} };
  try {
    const r = await spotifyFetch(`/search?q=${encodeURIComponent(clean)}&type=${type.join(",")}&limit=${limit}`);
    return { tracks: r?.tracks||{items:[]}, artists: r?.artists||{items:[]}, albums: r?.albums||{items:[]}, playlists: r?.playlists||{items:[]} };
  } catch { return { tracks:{items:[]}, artists:{items:[]}, albums:{items:[]}, playlists:{items:[]} }; }
};

// ── Other ─────────────────────────────────────────────────────────────────────
export const getUserProfile     = () => spotifyFetch("/me");
export const getAvailableDevices = () => spotifyFetch("/me/player/devices");
export const getAudioFeatures   = (id: string) => spotifyFetch(`/audio-features/${id}`);
export const getRecommendations = (seeds?: string[], artists?: string[], genres?: string[]) => {
  const p = new URLSearchParams();
  if (seeds?.length)   p.append("seed_tracks",  seeds.join(","));
  if (artists?.length) p.append("seed_artists", artists.join(","));
  if (genres?.length)  p.append("seed_genres",  genres.join(","));
  return spotifyFetch(`/recommendations?${p.toString()}`);
};
export const getQueue   = () => spotifyFetch("/me/player/queue");
export const addToQueue = (uri: string) => spotifyFetch(`/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: "POST" });

// ── Playlist management ───────────────────────────────────────────────────────

/** Crea una nuova playlist per l'utente */
export const createPlaylist = async (name: string, description = "", isPublic = false): Promise<any> => {
  const profile = await getUserProfile();
  if (!profile?.id) throw new Error("User profile not available");
  return spotifyFetch(`/users/${profile.id}/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: isPublic }),
  });
};

/** Aggiunge tracce a una playlist esistente (max 100 per chiamata) */
export const addTracksToPlaylist = (playlistId: string, uris: string[]) =>
  spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris: uris.slice(0, 100) }),
  });

/** Cerca una traccia per titolo + artista → restituisce la prima corrispondenza */
export const searchTrackByTitleArtist = async (title: string, artist: string): Promise<any | null> => {
  const q = `track:${title} artist:${artist}`;
  try {
    const r = await spotifyFetch(`/search?q=${encodeURIComponent(q)}&type=track&limit=5`);
    return r?.tracks?.items?.[0] ?? null;
  } catch { return null; }
};

/** Salva (like) una traccia nella libreria dell'utente */
export const likeTrack = (trackId: string) =>
  spotifyFetch("/me/tracks", { method: "PUT", body: JSON.stringify({ ids: [trackId] }) });

/** Rimuove il like da una traccia */
export const unlikeTrack = (trackId: string) =>
  spotifyFetch("/me/tracks", { method: "DELETE", body: JSON.stringify({ ids: [trackId] }) });

/** Verifica se una traccia è nella libreria */
export const isTrackSaved = async (trackId: string): Promise<boolean> => {
  const r = await spotifyFetch(`/me/tracks/contains?ids=${trackId}`);
  return r?.[0] ?? false;
};
