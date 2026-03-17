import { getToken } from "./spotify-auth";

const BASE = "https://api.spotify.com/v1";

interface Opts { method?: string; body?: any; headers?: any; }

const api = async (endpoint: string, opts: Opts = {}) => {
  const token = getToken();
  if (!token) throw new Error("No token available. Please login to Spotify.");

  const res = await fetch(`${BASE}${endpoint}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts.headers },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Authentication failed. Please login again.");
    if (res.status === 403) throw new Error("Permission denied. Check your Spotify Premium status.");
    if (res.status === 404 && endpoint.includes("/player/play")) throw new Error("NO_ACTIVE_DEVICE");
    if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
    throw new Error(`Spotify API error ${res.status}: ${res.statusText}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  const text = await res.text();
  if (!text.trim()) return null;
  try { return JSON.parse(text); } catch { return null; }
};

const pages = async (endpoint: string, limit = 50): Promise<any[]> => {
  const all: any[] = [];
  let offset = 0;
  while (true) {
    const d = await api(`${endpoint}${endpoint.includes("?") ? "&" : "?"}limit=${limit}&offset=${offset}`);
    if (!d?.items) break;
    all.push(...d.items);
    if (d.items.length < limit || !d.next) break;
    offset += limit;
  }
  return all;
};

// ── Player ─────────────────────────────────────────────────────────────────────

export const getCurrentlyPlaying = () => api("/me/player/currently-playing");
export const getPlaybackState    = () => api("/me/player");

/**
 * play — riproduce con supporto completo per:
 * - uris: tracce singole/multiple
 * - contextUri: playlist/album/artista → Spotify gestisce la coda automaticamente
 * - offset: posizione di partenza nel contesto ({ position: 0 } o { uri: "..." })
 */
export const play = async (
  deviceId?: string,
  contextUri?: string,
  uris?: string[],
  offset?: { position: number } | { uri: string },
) => {
  const body: Record<string, any> = {};
  if (contextUri) body.context_uri = contextUri;
  if (uris)       body.uris = uris;
  if (offset)     body.offset = offset;

  // Auto-seleziona dispositivo se non specificato
  if (!deviceId) {
    try {
      const devs = await getAvailableDevices();
      if (devs?.devices?.length > 0) {
        const active = devs.devices.find((d: any) => d.is_active);
        deviceId = active?.id || devs.devices[0].id;
      }
    } catch (_) {}
  }

  const q = deviceId ? `?device_id=${deviceId}` : "";
  try {
    return await api(`/me/player/play${q}`, { method: "PUT", body: JSON.stringify(body) });
  } catch (e: any) {
    if (e.message === "NO_ACTIVE_DEVICE" && deviceId) {
      return await api("/me/player/play", { method: "PUT", body: JSON.stringify(body) });
    }
    throw e;
  }
};

export const pause    = async () => { try { return await api("/me/player/pause",    { method: "PUT" }); } catch { return null; } };
export const next     = async () => { try { return await api("/me/player/next",     { method: "POST" }); } catch { return null; } };
export const previous = async () => { try { return await api("/me/player/previous", { method: "POST" }); } catch { return null; } };
export const seek     = async (ms: number) => { try { return await api(`/me/player/seek?position_ms=${Math.floor(ms)}`, { method: "PUT" }); } catch { return null; } };
export const setVolume = async (v: number) => { try { return await api(`/me/player/volume?volume_percent=${Math.max(0,Math.min(100,Math.floor(v)))}`, { method: "PUT" }); } catch { return null; } };
export const setShuffle = async (s: boolean) => { try { return await api(`/me/player/shuffle?state=${s}`, { method: "PUT" }); } catch { return null; } };
export const setRepeat  = async (s: "track"|"context"|"off") => { try { return await api(`/me/player/repeat?state=${s}`, { method: "PUT" }); } catch { return null; } };
export const transferPlayback = (id: string, play = true) =>
  api("/me/player", { method: "PUT", body: JSON.stringify({ device_ids: [id], play }) });

// ── Library ─────────────────────────────────────────────────────────────────────

export const getRecentlyPlayed  = (limit = 20) => api(`/me/player/recently-played?limit=${limit}`);
export const getTopTracks       = (t: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 20) => api(`/me/top/tracks?time_range=${t}&limit=${limit}`);
export const getTopArtists      = (t: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 20) => api(`/me/top/artists?time_range=${t}&limit=${limit}`);
export const getUserPlaylists   = async (): Promise<{ items: any[] }> => ({ items: await pages("/me/playlists", 50) });
export const getPlaylist        = (id: string) => api(`/playlists/${id}`);
export const getAllPlaylistTracks = async (id: string): Promise<any[]> => {
  const all: any[] = [];
  let offset = 0;
  while (true) {
    const d = await api(`/playlists/${id}/tracks?limit=100&offset=${offset}`);
    if (!d?.items) break;
    all.push(...d.items);
    if (d.items.length < 100 || !d.next) break;
    offset += 100;
  }
  return all;
};
export const getSavedTracks = async (limit?: number): Promise<{ items: any[]; total: number }> => {
  if (limit) { const d = await api(`/me/tracks?limit=${limit}`); return d || { items: [], total: 0 }; }
  const all = await pages("/me/tracks", 50);
  return { items: all, total: all.length };
};
export const saveTrack        = (id: string) => api("/me/tracks", { method: "PUT",    body: JSON.stringify({ ids: [id] }) });
export const removeTrack      = (id: string) => api("/me/tracks", { method: "DELETE", body: JSON.stringify({ ids: [id] }) });
export const checkSavedTracks = (ids: string[]) => api(`/me/tracks/contains?ids=${ids.join(",")}`);

// ── Search ─────────────────────────────────────────────────────────────────────

export const search = async (query: string, type: string[] = ["track","artist","album","playlist"], limit = 20) => {
  const q = query?.trim();
  if (!q || q.length < 2) return { tracks:{items:[]}, artists:{items:[]}, albums:{items:[]}, playlists:{items:[]} };
  try {
    const r = await api(`/search?q=${encodeURIComponent(q)}&type=${type.join(",")}&limit=${limit}`);
    return { tracks:r?.tracks||{items:[]}, artists:r?.artists||{items:[]}, albums:r?.albums||{items:[]}, playlists:r?.playlists||{items:[]} };
  } catch { return { tracks:{items:[]}, artists:{items:[]}, albums:{items:[]}, playlists:{items:[]} }; }
};

// ── Misc ─────────────────────────────────────────────────────────────────────────

export const getUserProfile     = () => api("/me");
export const getAvailableDevices = () => api("/me/player/devices");
export const getAudioFeatures   = (id: string) => api(`/audio-features/${id}`);
export const getRecommendations = (seeds?: string[], artists?: string[], genres?: string[]) => {
  const p = new URLSearchParams();
  seeds?.length   && p.append("seed_tracks",  seeds.join(","));
  artists?.length && p.append("seed_artists", artists.join(","));
  genres?.length  && p.append("seed_genres",  genres.join(","));
  return api(`/recommendations?${p}`);
};
export const getQueue   = () => api("/me/player/queue");
export const addToQueue = (uri: string) => api(`/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: "POST" });

// ── Playlist management ────────────────────────────────────────────────────────

export const createPlaylist = async (name: string, description = "", isPublic = false) => {
  const profile = await getUserProfile();
  if (!profile?.id) throw new Error("User profile not available");
  return api(`/users/${profile.id}/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: isPublic }),
  });
};

export const addTracksToPlaylist = (playlistId: string, uris: string[]) =>
  api(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris: uris.slice(0, 100) }),
  });

export const searchTrackByTitleArtist = async (title: string, artist: string): Promise<any | null> => {
  try {
    const r = await api(`/search?q=${encodeURIComponent(`track:${title} artist:${artist}`)}&type=track&limit=5`);
    return r?.tracks?.items?.[0] ?? null;
  } catch { return null; }
};

export const likeTrack   = (id: string) => api("/me/tracks", { method: "PUT",    body: JSON.stringify({ ids: [id] }) });
export const unlikeTrack = (id: string) => api("/me/tracks", { method: "DELETE", body: JSON.stringify({ ids: [id] }) });
export const isTrackSaved = async (id: string): Promise<boolean> => {
  const r = await api(`/me/tracks/contains?ids=${id}`);
  return r?.[0] ?? false;
};
