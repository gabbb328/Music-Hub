import { getToken } from "./spotify-auth";
import {
  getActiveProvider,
  universalAudioEngine,
  CATALOG_TRACKS,
  getActiveProviderUser,
  MUSIC_PROVIDERS,
} from "./music-providers";

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

export const getCurrentlyPlaying = async () => {
  if (getActiveProvider() !== "spotify") {
    const track = universalAudioEngine.getCurrentTrack();
    if (!track) return null;
    return {
      item: track,
      is_playing: universalAudioEngine.getIsPlaying(),
      progress_ms: universalAudioEngine.getPositionMs(),
      timestamp: Date.now(),
    };
  }
  return api("/me/player/currently-playing");
};

export const getPlaybackState = async () => {
  if (getActiveProvider() !== "spotify") {
    return universalAudioEngine.getPlaybackStateSnapshot();
  }
  return api("/me/player");
};

export const play = async (
  deviceId?: string,
  contextUri?: string,
  uris?: string[],
  offset?: { position: number } | { uri: string },
) => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    let targetTrack = tracks[0];

    if (uris && uris.length > 0) {
      const match = tracks.find((t) => uris.includes(t.uri) || uris.includes(t.id));
      if (match) targetTrack = match;
    } else if (offset && 'position' in offset && tracks[offset.position]) {
      targetTrack = tracks[offset.position];
    }

    universalAudioEngine.playTrack(targetTrack);
    return { status: "playing", track: targetTrack };
  }

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

export const pause = async (deviceId?: string) => {
  if (getActiveProvider() !== "spotify") {
    universalAudioEngine.pause();
    return { status: "paused" };
  }
  try {
    const q = deviceId ? `?device_id=${deviceId}` : "";
    return await api(`/me/player/pause${q}`, { method: "PUT" });
  } catch {
    return null;
  }
};

export const next = async () => {
  if (getActiveProvider() !== "spotify") {
    universalAudioEngine.next();
    return { status: "next" };
  }
  try { return await api("/me/player/next", { method: "POST" }); } catch { return null; }
};

export const previous = async () => {
  if (getActiveProvider() !== "spotify") {
    universalAudioEngine.previous();
    return { status: "previous" };
  }
  try { return await api("/me/player/previous", { method: "POST" }); } catch { return null; }
};

export const seek = async (ms: number, deviceId?: string) => {
  if (getActiveProvider() !== "spotify") {
    universalAudioEngine.seek(ms);
    return { status: "seeked", position_ms: ms };
  }
  try {
    const q = deviceId ? `&device_id=${deviceId}` : "";
    return await api(`/me/player/seek?position_ms=${Math.floor(ms)}${q}`, { method: "PUT" });
  } catch {
    return null;
  }
};

export const setVolume = async (v: number) => {
  if (getActiveProvider() !== "spotify") {
    universalAudioEngine.setVolume(v);
    return { status: "volume_set", volume: v };
  }
  try {
    return await api(`/me/player/volume?volume_percent=${Math.max(0,Math.min(100,Math.floor(v)))}`, { method: "PUT" });
  } catch {
    return null;
  }
};

export const setShuffle = async (s: boolean) => {
  if (getActiveProvider() !== "spotify") return { shuffle: s };
  try { return await api(`/me/player/shuffle?state=${s}`, { method: "PUT" }); } catch { return null; }
};

export const setRepeat = async (s: "track"|"context"|"off") => {
  if (getActiveProvider() !== "spotify") return { repeat: s };
  try { return await api(`/me/player/repeat?state=${s}`, { method: "PUT" }); } catch { return null; }
};

export const transferPlayback = (id: string, play = true) => {
  if (getActiveProvider() !== "spotify") return Promise.resolve(null);
  return api("/me/player", { method: "PUT", body: JSON.stringify({ device_ids: [id], play }) });
};

// ── Library ─────────────────────────────────────────────────────────────────────

export const getRecentlyPlayed = async (limit = 20) => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    return {
      items: tracks.slice(0, limit).map((track) => ({
        track,
        played_at: new Date(Date.now() - 3600000).toISOString(),
      })),
    };
  }
  return api(`/me/player/recently-played?limit=${limit}`);
};

export const getTopTracks = async (t: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 20) => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    return { items: tracks.slice(0, limit) };
  }
  return api(`/me/top/tracks?time_range=${t}&limit=${limit}`);
};

export const getTopArtists = async (t: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 20) => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    const artists = tracks.map((track) => ({
      id: track.artists[0]?.id || "art-1",
      name: track.artists[0]?.name || "Artista Top",
      genres: ["pop", "dance", "electronic"],
      images: track.album.images,
      popularity: 90,
      followers: { total: 15420000 },
    }));
    return { items: artists.slice(0, limit) };
  }
  return api(`/me/top/artists?time_range=${t}&limit=${limit}`);
};

export const getUserPlaylists = async (): Promise<{ items: any[] }> => {
  if (getActiveProvider() !== "spotify") {
    return universalAudioEngine.getPlaylistsSnapshot();
  }
  return { items: await pages("/me/playlists", 50) };
};

export const getPlaylist = async (id: string) => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const meta = MUSIC_PROVIDERS[provider];
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    return {
      id,
      name: `${meta.name} Playlist`,
      description: `Raccolta curata per gli utenti ${meta.name}.`,
      images: tracks[0]?.album.images || [],
      tracks: {
        total: tracks.length,
        items: tracks.map((track) => ({ track, added_at: new Date().toISOString() })),
      },
      owner: { display_name: meta.name, id: meta.id },
    };
  }
  return api(`/playlists/${id}`);
};

export const getAllPlaylistTracks = async (id: string): Promise<any[]> => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    return tracks.map((track) => ({ track }));
  }
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
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    const items = tracks.map((track) => ({ track, added_at: new Date().toISOString() }));
    return { items: limit ? items.slice(0, limit) : items, total: tracks.length };
  }
  if (limit) { const d = await api(`/me/tracks?limit=${limit}`); return d || { items: [], total: 0 }; }
  const all = await pages("/me/tracks", 50);
  return { items: all, total: all.length };
};

export const saveTrack = async (id: string) => {
  if (getActiveProvider() !== "spotify") return { success: true };
  return api("/me/tracks", { method: "PUT", body: JSON.stringify({ ids: [id] }) });
};

export const removeTrack = async (id: string) => {
  if (getActiveProvider() !== "spotify") return { success: true };
  return api("/me/tracks", { method: "DELETE", body: JSON.stringify({ ids: [id] }) });
};

export const checkSavedTracks = async (ids: string[]): Promise<boolean[]> => {
  if (getActiveProvider() !== "spotify") return ids.map(() => true);
  return api(`/me/tracks/contains?ids=${ids.join(",")}`);
};

// ── Search ─────────────────────────────────────────────────────────────────────

export const search = async (query: string, type: string[] = ["track","artist","album","playlist"], limit = 20) => {
  const q = query?.trim();
  if (!q || q.length < 2) return { tracks:{items:[]}, artists:{items:[]}, albums:{items:[]}, playlists:{items:[]} };

  if (getActiveProvider() !== "spotify") {
    return universalAudioEngine.search(q);
  }

  try {
    const r = await api(`/search?q=${encodeURIComponent(q)}&type=${type.join(",")}&limit=${limit}`);
    return { tracks:r?.tracks||{items:[]}, artists:r?.artists||{items:[]}, albums:r?.albums||{items:[]}, playlists:r?.playlists||{items:[]} };
  } catch {
    return universalAudioEngine.search(q);
  }
};

// ── Misc ─────────────────────────────────────────────────────────────────────────

export const getUserProfile = async () => {
  if (getActiveProvider() !== "spotify") {
    const user = getActiveProviderUser();
    const meta = MUSIC_PROVIDERS[user.provider || "apple_music"];
    return {
      id: `usr-${user.provider}`,
      display_name: user.name,
      email: user.email,
      product: user.tier || meta.defaultTier,
      images: user.avatar ? [{ url: user.avatar, height: 300, width: 300 }] : [],
      country: "IT",
      uri: `${user.provider}:user:${user.name}`,
    };
  }
  return api("/me");
};

export const getAvailableDevices = async () => {
  if (getActiveProvider() !== "spotify") {
    return {
      devices: [universalAudioEngine.getPlaybackStateSnapshot().device],
    };
  }
  return api("/me/player/devices");
};

export const getAudioFeatures = (id: string) => {
  if (getActiveProvider() !== "spotify") return Promise.resolve(null);
  return api(`/audio-features/${id}`);
};

export const getRecommendations = (params: Record<string, any>) => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    return Promise.resolve({ tracks });
  }
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      p.append(key, value.join(","));
    } else if (value !== undefined) {
      p.append(key, String(value));
    }
  }
  return api(`/recommendations?${p}`);
};

export const getQueue = async () => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
    return {
      currently_playing: universalAudioEngine.getCurrentTrack(),
      queue: tracks.slice(1),
    };
  }
  try { return await api("/me/player/queue"); } catch { return { currently_playing: null, queue: [] }; }
};

export const addToQueue = async (uri: string) => {
  if (getActiveProvider() !== "spotify") return { success: true };
  try { return await api(`/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: "POST" }); } catch { return null; }
};

// ── Playlist management ────────────────────────────────────────────────────────

export const createPlaylist = async (name: string, description = "", isPublic = false) => {
  if (getActiveProvider() !== "spotify") {
    const provider = getActiveProvider();
    return {
      id: `${provider}-user-pl-${Date.now()}`,
      name,
      description,
      public: isPublic,
      images: [],
      tracks: { total: 0 },
    };
  }
  const profile = await getUserProfile();
  if (!profile?.id) throw new Error("User profile not available");
  return api(`/users/${profile.id}/playlists`, {
    method: "POST",
    body: JSON.stringify({ name, description, public: isPublic }),
  });
};

export const addTracksToPlaylist = (playlistId: string, uris: string[]) => {
  if (getActiveProvider() !== "spotify") return Promise.resolve({ success: true });
  return api(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris: uris.slice(0, 100) }),
  });
};

export const searchTrackByTitleArtist = async (title: string, artist: string): Promise<any | null> => {
  if (getActiveProvider() !== "spotify") {
    const tracks = Object.values(CATALOG_TRACKS).flat();
    const match = tracks.find(
      (t) =>
        t.name.toLowerCase().includes(title.toLowerCase()) ||
        t.artists.some((a) => a.name.toLowerCase().includes(artist.toLowerCase()))
    );
    return match || tracks[0] || null;
  }
  try {
    const r = await api(`/search?q=${encodeURIComponent(`track:${title} artist:${artist}`)}&type=track&limit=5`);
    return r?.tracks?.items?.[0] ?? null;
  } catch { return null; }
};

export const likeTrack = async (id: string) => {
  if (getActiveProvider() !== "spotify") return { success: true };
  return api("/me/tracks", { method: "PUT", body: JSON.stringify({ ids: [id] }) });
};

export const unlikeTrack = async (id: string) => {
  if (getActiveProvider() !== "spotify") return { success: true };
  return api("/me/tracks", { method: "DELETE", body: JSON.stringify({ ids: [id] }) });
};

export const isTrackSaved = async (id: string): Promise<boolean> => {
  if (getActiveProvider() !== "spotify") return true;
  const r = await api(`/me/tracks/contains?ids=${id}`);
  return r?.[0] ?? false;
};
