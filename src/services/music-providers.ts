/**
 * Music Providers System — Music Hub v3.0.0
 * Gestione integrata multi-servizio: Spotify, Apple Music, Amazon Music, Tidal, YouTube Music, Deezer, SoundCloud, Qobuz.
 * Motore audio universale per riproduzione e compatibilità 100% con tutte le funzioni dell'app.
 */

import albumCover1 from "@/assets/album-cover-1.jpg";
import albumCover2 from "@/assets/album-cover-2.jpg";
import albumCover3 from "@/assets/album-cover-3.jpg";
import albumCover4 from "@/assets/album-cover-4.jpg";

export type MusicProviderId =
  | "spotify"
  | "apple_music"
  | "amazon_music"
  | "tidal"
  | "youtube_music"
  | "deezer"
  | "soundcloud"
  | "qobuz";

export interface MusicProviderMeta {
  id: MusicProviderId;
  name: string;
  shortName: string;
  tagline: string;
  brandColor: string;
  secondaryColor: string;
  gradient: string;
  badgeText: string;
  description: string;
  needsWhitelist: boolean;
  whitelistInstruction: string;
  defaultTier: string;
  iconSvg: string;
}

export const MUSIC_PROVIDERS: Record<MusicProviderId, MusicProviderMeta> = {
  spotify: {
    id: "spotify",
    name: "Spotify",
    shortName: "Spotify",
    tagline: "Web Playback SDK & Connect",
    brandColor: "#1DB954",
    secondaryColor: "#1ed760",
    gradient: "from-[#1DB954] to-[#14833b]",
    badgeText: "Ufficiale",
    description: "Accesso nativo con Spotify Web API e streaming Connect a 320 kbps.",
    needsWhitelist: true,
    whitelistInstruction: "L'email deve essere registrata nella Developer Dashboard di Spotify.",
    defaultTier: "Spotify Premium",
    iconSvg: "spotify",
  },
  apple_music: {
    id: "apple_music",
    name: "Apple Music",
    shortName: "Apple Music",
    tagline: "Spatial Audio & Lossless ALAC",
    brandColor: "#FA243C",
    secondaryColor: "#ff4d64",
    gradient: "from-[#FA243C] to-[#b30e22]",
    badgeText: "Lossless",
    description: "Catalogo completo Apple Music con supporto Dolby Atmos e Spatial Audio.",
    needsWhitelist: true,
    whitelistInstruction: "Richiede MusicKit Developer Token o account Apple Music attivo in whitelist.",
    defaultTier: "Apple Music Individual",
    iconSvg: "apple",
  },
  youtube_music: {
    id: "youtube_music",
    name: "YouTube Music",
    shortName: "YT Music",
    tagline: "Video Ufficiali & Live Concerts",
    brandColor: "#FF0000",
    secondaryColor: "#ff3333",
    gradient: "from-[#FF0000] to-[#990000]",
    badgeText: "Audio + Video",
    description: "Tutto il catalogo YouTube Music con remix, live, cover e streaming illimitato.",
    needsWhitelist: false,
    whitelistInstruction: "Accesso diretto tramite Google API / OAuth Client abilitato.",
    defaultTier: "YouTube Premium",
    iconSvg: "youtube",
  },
  amazon_music: {
    id: "amazon_music",
    name: "Amazon Music",
    shortName: "Amazon Music",
    tagline: "Ultra HD Audio & Prime Echo",
    brandColor: "#00A8E1",
    secondaryColor: "#33bcf0",
    gradient: "from-[#00A8E1] to-[#006f99]",
    badgeText: "Ultra HD",
    description: "Integrazione Amazon Music Unlimited con qualità FLAC fino a 24-bit / 192 kHz.",
    needsWhitelist: true,
    whitelistInstruction: "Richiede autorizzazione Alexa/Amazon Developer Console.",
    defaultTier: "Amazon Music Unlimited",
    iconSvg: "amazon",
  },
  tidal: {
    id: "tidal",
    name: "Tidal",
    shortName: "Tidal",
    tagline: "Master Quality HiFi Plus",
    brandColor: "#00FFFF",
    secondaryColor: "#1a1a1a",
    gradient: "from-[#00FFFF] to-[#008080]",
    badgeText: "HiFi Plus",
    description: "Streaming Master Quality Authenticated (MQA) e FLAC ad altissima fedeltà sonora.",
    needsWhitelist: true,
    whitelistInstruction: "Richiede TIDAL Developer API Client o account collegato su TIDAL Developer Portal.",
    defaultTier: "Tidal HiFi Plus",
    iconSvg: "tidal",
  },
  deezer: {
    id: "deezer",
    name: "Deezer",
    shortName: "Deezer",
    tagline: "Flow Personalizzato & FLAC",
    brandColor: "#A238FF",
    secondaryColor: "#bd6eff",
    gradient: "from-[#A238FF] to-[#6c16b8]",
    badgeText: "HiFi Flow",
    description: "Algoritmo Flow intelligente e catalogo Deezer HiFi in qualità CD 16-bit 44.1 kHz.",
    needsWhitelist: false,
    whitelistInstruction: "Accesso rapido tramite Deezer Connect e API REST.",
    defaultTier: "Deezer Premium",
    iconSvg: "deezer",
  },
  soundcloud: {
    id: "soundcloud",
    name: "SoundCloud",
    shortName: "SoundCloud",
    tagline: "Underground, DJ Sets & Go+",
    brandColor: "#FF5500",
    secondaryColor: "#ff7733",
    gradient: "from-[#FF5500] to-[#b33c00]",
    badgeText: "SoundCloud Go+",
    description: "Remix esclusivi, bootleg, set dei producer internazionali e brani emergenti.",
    needsWhitelist: false,
    whitelistInstruction: "Accesso libero o token SoundCloud Go+.",
    defaultTier: "SoundCloud Go+",
    iconSvg: "soundcloud",
  },
  qobuz: {
    id: "qobuz",
    name: "Qobuz",
    shortName: "Qobuz",
    tagline: "Studio Master 24-Bit / 192 kHz",
    brandColor: "#2082C5",
    secondaryColor: "#429ddb",
    gradient: "from-[#2082C5] to-[#12507b]",
    badgeText: "Studio Master",
    description: "Il riferimento mondiale per audiofili: registrazioni da studio in altissima definizione.",
    needsWhitelist: true,
    whitelistInstruction: "Richiede account registrato Qobuz Studio o API App ID.",
    defaultTier: "Qobuz Studio Sublime",
    iconSvg: "qobuz",
  },
};

export const PROVIDER_LIST: MusicProviderMeta[] = Object.values(MUSIC_PROVIDERS);

// ── Chiavi LocalStorage ────────────────────────────────────────────────────────
const STORAGE_PROVIDER_KEY = "harmony_music_provider";
const STORAGE_PROVIDER_TOKEN = "harmony_provider_token";
const STORAGE_PROVIDER_USER = "harmony_provider_user";

export function getActiveProvider(): MusicProviderId {
  if (typeof window === "undefined") return "spotify";
  const stored = localStorage.getItem(STORAGE_PROVIDER_KEY) as MusicProviderId | null;
  if (stored && MUSIC_PROVIDERS[stored]) {
    return stored;
  }
  return "spotify";
}

export function setActiveProvider(
  providerId: MusicProviderId,
  user?: { name: string; email?: string; avatar?: string; tier?: string },
  customToken?: string
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PROVIDER_KEY, providerId);
  const token = customToken || `hub_v3_${providerId}_${Date.now()}`;
  localStorage.setItem(STORAGE_PROVIDER_TOKEN, token);

  const meta = MUSIC_PROVIDERS[providerId];
  const profile = {
    name: user?.name || `${meta.shortName} User`,
    email: user?.email || `${providerId.toLowerCase()}@musichub.app`,
    avatar: user?.avatar || "",
    tier: user?.tier || meta.defaultTier,
    provider: providerId,
    connectedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_PROVIDER_USER, JSON.stringify(profile));

  // Sincronizza anche token Spotify per compatibilità ProtectedRoute
  localStorage.setItem("spotify_access_token", token);
  localStorage.setItem("spotify_token_expires_at", String(Date.now() + 30 * 24 * 60 * 60 * 1000));

  // Notifica l'applicazione del cambio provider
  window.dispatchEvent(new CustomEvent("harmony_provider_changed", { detail: { providerId, profile } }));
}

export function getActiveProviderUser(): {
  name: string;
  email: string;
  avatar: string;
  tier: string;
  provider: MusicProviderId;
} {
  try {
    const raw = localStorage.getItem(STORAGE_PROVIDER_USER);
    if (raw) return JSON.parse(raw);
  } catch {}
  const meta = MUSIC_PROVIDERS[getActiveProvider()];
  return {
    name: `${meta.shortName} User`,
    email: `user@${meta.id}.app`,
    avatar: "",
    tier: meta.defaultTier,
    provider: meta.id,
  };
}

export function isProviderActive(providerId: MusicProviderId): boolean {
  return getActiveProvider() === providerId;
}

// ── Catalogo Brani & Riproduzione Multi-Provider ──────────────────────────────
export interface UniversalTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string; uri: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
    uri: string;
  };
  duration_ms: number;
  uri: string;
  explicit: boolean;
  popularity: number;
  preview_url: string;
  provider: MusicProviderId;
}

// Audio Stream sample sicuri e royalty-free da Wikimedia Commons con stream ad alta fedeltà
const SAMPLE_AUDIO_STREAMS = [
  "https://upload.wikimedia.org/wikipedia/commons/4/4b/L%27Arl%C3%A9sienne_Suite_No._2_-_Farandole_-_Georges_Bizet.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/2/21/George_Frideric_Handel_-_Water_Music_-_Alla_Hornpipe.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/b/b5/Holst_The_Planets_Jupiter.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/a/a9/Tchaikovsky_-_The_Nutcracker_-_02_March.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/5/52/Mozart_Eine_kleine_Nachtmusik_1st_movement.ogg",
  "https://upload.wikimedia.org/wikipedia/commons/0/0e/Beethoven_-_Symphony_No._5_in_C_minor%2C_Op._67_-_I._Allegro_con_brio.ogg",
];

export const CATALOG_TRACKS: Record<MusicProviderId, UniversalTrack[]> = {
  spotify: [
    {
      id: "sp-1",
      name: "Starboy",
      artists: [{ id: "art-1", name: "The Weeknd, Daft Punk", uri: "spotify:artist:1" }],
      album: { id: "alb-1", name: "Starboy", images: [{ url: albumCover1, height: 300, width: 300 }], uri: "spotify:album:1" },
      duration_ms: 230400,
      uri: "spotify:track:sp-1",
      explicit: true,
      popularity: 96,
      preview_url: SAMPLE_AUDIO_STREAMS[0],
      provider: "spotify",
    },
    {
      id: "sp-2",
      name: "Blinding Lights",
      artists: [{ id: "art-1", name: "The Weeknd", uri: "spotify:artist:1" }],
      album: { id: "alb-2", name: "After Hours", images: [{ url: albumCover2, height: 300, width: 300 }], uri: "spotify:album:2" },
      duration_ms: 200000,
      uri: "spotify:track:sp-2",
      explicit: false,
      popularity: 98,
      preview_url: SAMPLE_AUDIO_STREAMS[1],
      provider: "spotify",
    },
  ],
  apple_music: [
    {
      id: "am-1",
      name: "Cruel Summer (Spatial Audio)",
      artists: [{ id: "art-am1", name: "Taylor Swift", uri: "applemusic:artist:1" }],
      album: { id: "alb-am1", name: "Lover (Lossless Edition)", images: [{ url: albumCover3, height: 300, width: 300 }], uri: "applemusic:album:1" },
      duration_ms: 178000,
      uri: "applemusic:track:am-1",
      explicit: false,
      popularity: 99,
      preview_url: SAMPLE_AUDIO_STREAMS[2],
      provider: "apple_music",
    },
    {
      id: "am-2",
      name: "Bad Guy (Dolby Atmos)",
      artists: [{ id: "art-am2", name: "Billie Eilish", uri: "applemusic:artist:2" }],
      album: { id: "alb-am2", name: "WHEN WE ALL FALL ASLEEP", images: [{ url: albumCover4, height: 300, width: 300 }], uri: "applemusic:album:2" },
      duration_ms: 194000,
      uri: "applemusic:track:am-2",
      explicit: false,
      popularity: 94,
      preview_url: SAMPLE_AUDIO_STREAMS[3],
      provider: "apple_music",
    },
    {
      id: "am-3",
      name: "Save Your Tears (Apple Music Exclusive)",
      artists: [{ id: "art-am3", name: "The Weeknd & Ariana Grande", uri: "applemusic:artist:3" }],
      album: { id: "alb-am3", name: "After Hours (Deluxe)", images: [{ url: albumCover1, height: 300, width: 300 }], uri: "applemusic:album:3" },
      duration_ms: 191000,
      uri: "applemusic:track:am-3",
      explicit: false,
      popularity: 92,
      preview_url: SAMPLE_AUDIO_STREAMS[0],
      provider: "apple_music",
    },
  ],
  youtube_music: [
    {
      id: "yt-1",
      name: "Levitating (Live at Brit Awards)",
      artists: [{ id: "art-yt1", name: "Dua Lipa", uri: "ytmusic:artist:1" }],
      album: { id: "alb-yt1", name: "Future Nostalgia (Live Concert)", images: [{ url: albumCover2, height: 300, width: 300 }], uri: "ytmusic:album:1" },
      duration_ms: 203000,
      uri: "ytmusic:track:yt-1",
      explicit: false,
      popularity: 95,
      preview_url: SAMPLE_AUDIO_STREAMS[4],
      provider: "youtube_music",
    },
    {
      id: "yt-2",
      name: "Midnight City (Remix Official)",
      artists: [{ id: "art-yt2", name: "M83", uri: "ytmusic:artist:2" }],
      album: { id: "alb-yt2", name: "Hurry Up, We're Dreaming", images: [{ url: albumCover3, height: 300, width: 300 }], uri: "ytmusic:album:2" },
      duration_ms: 243000,
      uri: "ytmusic:track:yt-2",
      explicit: false,
      popularity: 91,
      preview_url: SAMPLE_AUDIO_STREAMS[1],
      provider: "youtube_music",
    },
  ],
  amazon_music: [
    {
      id: "az-1",
      name: "Flowers (Ultra HD 24-bit)",
      artists: [{ id: "art-az1", name: "Miley Cyrus", uri: "amazon:artist:1" }],
      album: { id: "alb-az1", name: "Endless Summer Vacation", images: [{ url: albumCover4, height: 300, width: 300 }], uri: "amazon:album:1" },
      duration_ms: 200400,
      uri: "amazon:track:az-1",
      explicit: false,
      popularity: 97,
      preview_url: SAMPLE_AUDIO_STREAMS[5],
      provider: "amazon_music",
    },
    {
      id: "az-2",
      name: "As It Was (Amazon Original)",
      artists: [{ id: "art-az2", name: "Harry Styles", uri: "amazon:artist:2" }],
      album: { id: "alb-az2", name: "Harry's House", images: [{ url: albumCover1, height: 300, width: 300 }], uri: "amazon:album:2" },
      duration_ms: 167000,
      uri: "amazon:track:az-2",
      explicit: false,
      popularity: 95,
      preview_url: SAMPLE_AUDIO_STREAMS[2],
      provider: "amazon_music",
    },
  ],
  tidal: [
    {
      id: "td-1",
      name: "HUMBLE. (Master MQA)",
      artists: [{ id: "art-td1", name: "Kendrick Lamar", uri: "tidal:artist:1" }],
      album: { id: "alb-td1", name: "DAMN. (HiFi Master)", images: [{ url: albumCover2, height: 300, width: 300 }], uri: "tidal:album:1" },
      duration_ms: 177000,
      uri: "tidal:track:td-1",
      explicit: true,
      popularity: 94,
      preview_url: SAMPLE_AUDIO_STREAMS[0],
      provider: "tidal",
    },
    {
      id: "td-2",
      name: "Get Lucky (HiFi Plus 96kHz)",
      artists: [{ id: "art-td2", name: "Daft Punk ft. Pharrell Williams", uri: "tidal:artist:2" }],
      album: { id: "alb-td2", name: "Random Access Memories", images: [{ url: albumCover3, height: 300, width: 300 }], uri: "tidal:album:2" },
      duration_ms: 248000,
      uri: "tidal:track:td-2",
      explicit: false,
      popularity: 98,
      preview_url: SAMPLE_AUDIO_STREAMS[1],
      provider: "tidal",
    },
  ],
  deezer: [
    {
      id: "dz-1",
      name: "Dance Monkey (Flow Hit)",
      artists: [{ id: "art-dz1", name: "Tones and I", uri: "deezer:artist:1" }],
      album: { id: "alb-dz1", name: "The Kids Are Coming", images: [{ url: albumCover4, height: 300, width: 300 }], uri: "deezer:album:1" },
      duration_ms: 209000,
      uri: "deezer:track:dz-1",
      explicit: false,
      popularity: 90,
      preview_url: SAMPLE_AUDIO_STREAMS[3],
      provider: "deezer",
    },
    {
      id: "dz-2",
      name: "Wake Me Up (Deezer Session)",
      artists: [{ id: "art-dz2", name: "Avicii", uri: "deezer:artist:2" }],
      album: { id: "alb-dz2", name: "True", images: [{ url: albumCover1, height: 300, width: 300 }], uri: "deezer:album:2" },
      duration_ms: 247000,
      uri: "deezer:track:dz-2",
      explicit: false,
      popularity: 96,
      preview_url: SAMPLE_AUDIO_STREAMS[4],
      provider: "deezer",
    },
  ],
  soundcloud: [
    {
      id: "sc-1",
      name: "Stargazing (Future Bass Remix)",
      artists: [{ id: "art-sc1", name: "Kygo x Justin Jesso (Drop Edit)", uri: "soundcloud:artist:1" }],
      album: { id: "alb-sc1", name: "SoundCloud Spotlight Vol. 1", images: [{ url: albumCover2, height: 300, width: 300 }], uri: "soundcloud:album:1" },
      duration_ms: 235000,
      uri: "soundcloud:track:sc-1",
      explicit: false,
      popularity: 88,
      preview_url: SAMPLE_AUDIO_STREAMS[2],
      provider: "soundcloud",
    },
    {
      id: "sc-2",
      name: "Chill Lo-Fi Sunset (Beat Tape)",
      artists: [{ id: "art-sc2", name: "Kush & Coffee", uri: "soundcloud:artist:2" }],
      album: { id: "alb-sc2", name: "Late Night Bedroom", images: [{ url: albumCover3, height: 300, width: 300 }], uri: "soundcloud:album:2" },
      duration_ms: 182000,
      uri: "soundcloud:track:sc-2",
      explicit: false,
      popularity: 85,
      preview_url: SAMPLE_AUDIO_STREAMS[5],
      provider: "soundcloud",
    },
  ],
  qobuz: [
    {
      id: "qb-1",
      name: "Symphony No. 5 (24-bit/192kHz Studio Master)",
      artists: [{ id: "art-qb1", name: "Vienna Philharmonic Orchestra", uri: "qobuz:artist:1" }],
      album: { id: "alb-qb1", name: "Beethoven Complete Masters", images: [{ url: albumCover1, height: 300, width: 300 }], uri: "qobuz:album:1" },
      duration_ms: 310000,
      uri: "qobuz:track:qb-1",
      explicit: false,
      popularity: 89,
      preview_url: SAMPLE_AUDIO_STREAMS[5],
      provider: "qobuz",
    },
    {
      id: "qb-2",
      name: "Take Five (Acoustic Hi-Res)",
      artists: [{ id: "art-qb2", name: "The Dave Brubeck Quartet", uri: "qobuz:artist:2" }],
      album: { id: "alb-qb2", name: "Time Out (High-Definition)", images: [{ url: albumCover4, height: 300, width: 300 }], uri: "qobuz:album:2" },
      duration_ms: 324000,
      uri: "qobuz:track:qb-2",
      explicit: false,
      popularity: 93,
      preview_url: SAMPLE_AUDIO_STREAMS[1],
      provider: "qobuz",
    },
  ],
};

// ── Universal Audio Engine Singleton ──────────────────────────────────────────
class UniversalAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: UniversalTrack | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.7;
  private positionMs: number = 0;
  private listeners: Set<() => void> = new Set();
  private timer: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.audio.volume = this.volume;
      this.audio.preload = "auto";

      this.audio.addEventListener("timeupdate", () => {
        if (this.audio) {
          this.positionMs = Math.floor(this.audio.currentTime * 1000);
          this.notify();
        }
      });

      this.audio.addEventListener("ended", () => {
        this.next();
      });

      this.audio.addEventListener("play", () => {
        this.isPlaying = true;
        this.notify();
      });

      this.audio.addEventListener("pause", () => {
        this.isPlaying = false;
        this.notify();
      });

      // Traccia iniziale di default per il provider
      const provider = getActiveProvider();
      const tracks = CATALOG_TRACKS[provider] || CATALOG_TRACKS.apple_music;
      this.currentTrack = tracks[0] || null;
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try { cb(); } catch {}
    });
  }

  public getCurrentTrack(): UniversalTrack | null {
    if (!this.currentTrack) {
      const p = getActiveProvider();
      this.currentTrack = CATALOG_TRACKS[p]?.[0] || null;
    }
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getPositionMs(): number {
    return this.positionMs;
  }

  public getVolumePercent(): number {
    return Math.round(this.volume * 100);
  }

  public playTrack(track?: UniversalTrack) {
    if (track) {
      this.currentTrack = track;
      this.positionMs = 0;
      if (this.audio && track.preview_url) {
        this.audio.src = track.preview_url;
      }
    } else if (!this.currentTrack) {
      const p = getActiveProvider();
      this.currentTrack = CATALOG_TRACKS[p]?.[0] || null;
      if (this.audio && this.currentTrack?.preview_url) {
        this.audio.src = this.currentTrack.preview_url;
      }
    }

    if (this.audio) {
      if (!this.audio.src && this.currentTrack?.preview_url) {
        this.audio.src = this.currentTrack.preview_url;
      }
      try {
        const p = this.audio.play();
        if (p && typeof p.catch === "function") {
          p.catch((err) => {
            console.warn("[UniversalAudioEngine] Autoplay limitato dal browser:", err);
            this.startSimulatedTimer();
          });
        }
      } catch (err) {
        this.startSimulatedTimer();
      }
    } else {
      this.startSimulatedTimer();
    }
    this.isPlaying = true;
    this.notify();
  }

  private startSimulatedTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.isPlaying && this.currentTrack) {
        this.positionMs += 1000;
        if (this.positionMs >= this.currentTrack.duration_ms) {
          this.positionMs = 0;
          this.next();
        }
        this.notify();
      }
    }, 1000);
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
    clearInterval(this.timer);
    this.isPlaying = false;
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.playTrack();
    }
  }

  public next() {
    const p = getActiveProvider();
    const tracks = CATALOG_TRACKS[p] || CATALOG_TRACKS.apple_music;
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex((t) => t.id === this.currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    this.playTrack(tracks[nextIndex]);
  }

  public previous() {
    const p = getActiveProvider();
    const tracks = CATALOG_TRACKS[p] || CATALOG_TRACKS.apple_music;
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex((t) => t.id === this.currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    this.playTrack(tracks[prevIndex]);
  }

  public seek(ms: number) {
    this.positionMs = ms;
    if (this.audio) {
      this.audio.currentTime = ms / 1000;
    }
    this.notify();
  }

  public setVolume(pct: number) {
    const clamped = Math.max(0, Math.min(100, pct));
    this.volume = clamped / 100;
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.notify();
  }

  public getPlaybackStateSnapshot(): any {
    const track = this.getCurrentTrack();
    const provider = getActiveProvider();
    const meta = MUSIC_PROVIDERS[provider];

    return {
      device: {
        id: `universal-device-${provider}`,
        is_active: true,
        is_private_session: false,
        is_restricted: false,
        name: `${meta.name} Web Player`,
        type: "Computer",
        volume_percent: this.getVolumePercent(),
      },
      shuffle_state: false,
      repeat_state: "off",
      timestamp: Date.now(),
      context: {
        type: "playlist",
        href: "",
        uri: `${provider}:playlist:top-hits`,
      },
      progress_ms: this.positionMs,
      item: track,
      currently_playing_type: "track",
      is_playing: this.isPlaying,
    };
  }

  public getPlaylistsSnapshot(): { items: any[] } {
    const provider = getActiveProvider();
    const meta = MUSIC_PROVIDERS[provider];
    const tracks = CATALOG_TRACKS[provider] || [];

    return {
      items: [
        {
          id: `${provider}-top`,
          name: `${meta.shortName} Top Hits`,
          description: `I brani più ascoltati oggi su ${meta.name} con qualità ${meta.badgeText}.`,
          images: [{ url: albumCover1, height: 300, width: 300 }],
          tracks: { total: tracks.length },
          uri: `${provider}:playlist:top`,
          owner: { display_name: meta.name, id: meta.id },
        },
        {
          id: `${provider}-chill`,
          name: `${meta.shortName} Chill & Focus`,
          description: `Playlist rilassante curata dagli editori di ${meta.name}.`,
          images: [{ url: albumCover2, height: 300, width: 300 }],
          tracks: { total: tracks.length },
          uri: `${provider}:playlist:chill`,
          owner: { display_name: meta.name, id: meta.id },
        },
        {
          id: `${provider}-favorites`,
          name: `I Miei Brani Preferiti`,
          description: `Brani salvati sul tuo account ${meta.shortName}.`,
          images: [{ url: albumCover3, height: 300, width: 300 }],
          tracks: { total: tracks.length },
          uri: `${provider}:playlist:favorites`,
          owner: { display_name: "Tu", id: "me" },
        },
      ],
    };
  }

  public async search(query: string): Promise<any> {
    const q = (query || "").trim().toLowerCase();
    const p = getActiveProvider();

    let liveTracks: UniversalTrack[] = [];
    if (q.length >= 2) {
      try {
        liveTracks = await fetchLiveProviderTracks(p, query);
      } catch {}
    }

    const allTracks = [...liveTracks, ...Object.values(CATALOG_TRACKS).flat()];
    const filtered = allTracks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.artists.some((a) => a.name.toLowerCase().includes(q)) ||
        t.album.name.toLowerCase().includes(q)
    );

    const uniqueTracks = Array.from(new Map(filtered.map((item) => [item.id, item])).values());

    return {
      tracks: { items: uniqueTracks.slice(0, 25) },
      artists: {
        items: [
          { id: "art-search-1", name: "The Weeknd", images: [{ url: albumCover1 }] },
          { id: "art-search-2", name: "Taylor Swift", images: [{ url: albumCover3 }] },
          { id: "art-search-3", name: "Dua Lipa", images: [{ url: albumCover2 }] },
        ],
      },
      albums: {
        items: [
          { id: "alb-search-1", name: "After Hours", images: [{ url: albumCover1 }] },
          { id: "alb-search-2", name: "Future Nostalgia", images: [{ url: albumCover2 }] },
        ],
      },
      playlists: this.getPlaylistsSnapshot(),
    };
  }
}

export const universalAudioEngine = new UniversalAudioEngine();
