# 🎓 Esempi di Utilizzo API Spotify

Questa guida mostra come usare gli hook e le API Spotify nei tuoi componenti.

## 📚 Indice

- [Autenticazione](#autenticazione)
- [Player Controls](#player-controls)
- [Dati Utente](#dati-utente)
- [Ricerca](#ricerca)
- [Playlist](#playlist)
- [Dispositivi](#dispositivi)
- [Esempi Avanzati](#esempi-avanzati)

## 🔐 Autenticazione

### Login con Spotify

```tsx
import { getAuthUrl } from "@/services/spotify-auth";

function LoginButton() {
  const handleLogin = () => {
    window.location.href = getAuthUrl();
  };

  return <button onClick={handleLogin}>Login con Spotify</button>;
}
```

### Verificare se l'utente è loggato

```tsx
import { getToken, isTokenValid } from "@/services/spotify-auth";

function MyComponent() {
  const token = getToken();
  const valid = isTokenValid();

  if (!token || !valid) {
    return <LoginPrompt />;
  }

  return <App />;
}
```

### Logout

```tsx
import { removeToken } from "@/services/spotify-auth";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

## 🎵 Player Controls

### Ottenere lo stato del player

```tsx
import { usePlaybackState } from "@/hooks/useSpotify";

function PlayerStatus() {
  const { data: state, isLoading } = usePlaybackState();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Playing: {state?.is_playing ? "Yes" : "No"}</p>
      <p>Track: {state?.item?.name}</p>
      <p>Artist: {state?.item?.artists[0]?.name}</p>
    </div>
  );
}
```

### Play/Pause

```tsx
import { usePlayMutation, usePauseMutation } from "@/hooks/useSpotify";

function PlayPauseButton() {
  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const [isPlaying, setIsPlaying] = useState(false);

  const toggle = () => {
    if (isPlaying) {
      pauseMutation.mutate();
    } else {
      playMutation.mutate({});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button onClick={toggle}>
      {isPlaying ? "Pause" : "Play"}
    </button>
  );
}
```

### Riprodurre una traccia specifica

```tsx
import { usePlayMutation } from "@/hooks/useSpotify";

function TrackItem({ track }) {
  const playMutation = usePlayMutation();

  const playTrack = () => {
    playMutation.mutate({
      uris: [track.uri]
    });
  };

  return (
    <div onClick={playTrack}>
      <img src={track.album.images[0]?.url} alt={track.name} />
      <h3>{track.name}</h3>
      <p>{track.artists[0]?.name}</p>
    </div>
  );
}
```

### Riprodurre una playlist

```tsx
import { usePlayMutation } from "@/hooks/useSpotify";

function PlaylistItem({ playlist }) {
  const playMutation = usePlayMutation();

  const playPlaylist = () => {
    playMutation.mutate({
      contextUri: playlist.uri
    });
  };

  return (
    <button onClick={playPlaylist}>
      Play Playlist: {playlist.name}
    </button>
  );
}
```

### Skip traccia

```tsx
import { useNextMutation, usePreviousMutation } from "@/hooks/useSpotify";

function SkipButtons() {
  const nextMutation = useNextMutation();
  const previousMutation = usePreviousMutation();

  return (
    <div>
      <button onClick={() => previousMutation.mutate()}>
        Previous
      </button>
      <button onClick={() => nextMutation.mutate()}>
        Next
      </button>
    </div>
  );
}
```

### Controllo volume

```tsx
import { useSetVolumeMutation } from "@/hooks/useSpotify";

function VolumeControl() {
  const [volume, setVolume] = useState(50);
  const setVolumeMutation = useSetVolumeMutation();

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setVolumeMutation.mutate(newVolume);
  };

  return (
    <input
      type="range"
      min="0"
      max="100"
      value={volume}
      onChange={(e) => handleVolumeChange(Number(e.target.value))}
    />
  );
}
```

### Shuffle e Repeat

```tsx
import { useShuffleMutation, useRepeatMutation } from "@/hooks/useSpotify";

function ShuffleRepeatControls() {
  const shuffleMutation = useShuffleMutation();
  const repeatMutation = useRepeatMutation();

  return (
    <div>
      <button onClick={() => shuffleMutation.mutate(true)}>
        Shuffle On
      </button>
      <button onClick={() => shuffleMutation.mutate(false)}>
        Shuffle Off
      </button>
      <button onClick={() => repeatMutation.mutate("context")}>
        Repeat All
      </button>
      <button onClick={() => repeatMutation.mutate("track")}>
        Repeat One
      </button>
      <button onClick={() => repeatMutation.mutate("off")}>
        Repeat Off
      </button>
    </div>
  );
}
```

## 👤 Dati Utente

### Profilo utente

```tsx
import { useUserProfile } from "@/hooks/useSpotify";

function UserProfile() {
  const { data: profile, isLoading, error } = useUserProfile();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;

  return (
    <div>
      <img src={profile?.images[0]?.url} alt={profile?.display_name} />
      <h2>{profile?.display_name}</h2>
      <p>{profile?.email}</p>
      <p>Plan: {profile?.product}</p>
      <p>Followers: {profile?.followers.total}</p>
    </div>
  );
}
```

### Recently Played

```tsx
import { useRecentlyPlayed } from "@/hooks/useSpotify";

function RecentlyPlayed() {
  const { data, isLoading } = useRecentlyPlayed(10);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.items.map((item) => (
        <div key={item.played_at}>
          <p>{item.track.name}</p>
          <p>Played at: {new Date(item.played_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Top Tracks

```tsx
import { useTopTracks } from "@/hooks/useSpotify";

function TopTracks() {
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("medium_term");
  const { data } = useTopTracks(timeRange);

  return (
    <div>
      <select onChange={(e) => setTimeRange(e.target.value as any)}>
        <option value="short_term">Last 4 weeks</option>
        <option value="medium_term">Last 6 months</option>
        <option value="long_term">All time</option>
      </select>

      {data?.items.map((track, index) => (
        <div key={track.id}>
          <span>{index + 1}</span>
          <p>{track.name}</p>
          <p>{track.artists[0]?.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### Top Artists

```tsx
import { useTopArtists } from "@/hooks/useSpotify";

function TopArtists() {
  const { data } = useTopArtists("medium_term");

  return (
    <div>
      {data?.items.map((artist) => (
        <div key={artist.id}>
          <img src={artist.images[0]?.url} alt={artist.name} />
          <h3>{artist.name}</h3>
          <p>Genres: {artist.genres.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔍 Ricerca

### Ricerca semplice

```tsx
import { useSearch } from "@/hooks/useSpotify";
import { useState } from "react";

function SearchBar() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSearch(query, ["track", "artist"]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />

      {isLoading && <div>Searching...</div>}

      <div>
        <h3>Tracks</h3>
        {data?.tracks?.items.map((track) => (
          <div key={track.id}>{track.name}</div>
        ))}

        <h3>Artists</h3>
        {data?.artists?.items.map((artist) => (
          <div key={artist.id}>{artist.name}</div>
        ))}
      </div>
    </div>
  );
}
```

### Ricerca con debounce

```tsx
import { useSearch } from "@/hooks/useSpotify";
import { useDebounce } from "@/hooks/use-mobile";
import { useState } from "react";

function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const { data } = useSearch(debouncedQuery, ["track"]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* Results will update 500ms after user stops typing */}
      {data?.tracks?.items.map((track) => (
        <div key={track.id}>{track.name}</div>
      ))}
    </div>
  );
}
```

## 📚 Playlist

### Lista playlist utente

```tsx
import { useUserPlaylists } from "@/hooks/useSpotify";

function MyPlaylists() {
  const { data, isLoading } = useUserPlaylists();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.items.map((playlist) => (
        <div key={playlist.id}>
          <img src={playlist.images[0]?.url} alt={playlist.name} />
          <h3>{playlist.name}</h3>
          <p>{playlist.tracks.total} tracks</p>
          <p>By {playlist.owner.display_name}</p>
        </div>
      ))}
    </div>
  );
}
```

### Dettagli playlist

```tsx
import { usePlaylist } from "@/hooks/useSpotify";

function PlaylistDetails({ playlistId }: { playlistId: string }) {
  const { data: playlist } = usePlaylist(playlistId);

  return (
    <div>
      <h1>{playlist?.name}</h1>
      <p>{playlist?.description}</p>
      <div>
        {playlist?.tracks.items.map((item) => (
          <div key={item.track.id}>
            <p>{item.track.name}</p>
            <p>{item.track.artists[0]?.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Salvare/Rimuovere tracce

```tsx
import { useSaveTrackMutation, useRemoveTrackMutation } from "@/hooks/useSpotify";

function SaveTrackButton({ trackId }: { trackId: string }) {
  const saveTrack = useSaveTrackMutation();
  const removeTrack = useRemoveTrackMutation();
  const [isSaved, setIsSaved] = useState(false);

  const toggle = () => {
    if (isSaved) {
      removeTrack.mutate(trackId);
    } else {
      saveTrack.mutate(trackId);
    }
    setIsSaved(!isSaved);
  };

  return (
    <button onClick={toggle}>
      {isSaved ? "Remove from Library" : "Save to Library"}
    </button>
  );
}
```

## 📱 Dispositivi

### Lista dispositivi disponibili

```tsx
import { useAvailableDevices } from "@/hooks/useSpotify";

function DeviceList() {
  const { data } = useAvailableDevices();

  return (
    <div>
      {data?.devices.map((device) => (
        <div key={device.id}>
          <p>{device.name}</p>
          <p>Type: {device.type}</p>
          <p>Volume: {device.volume_percent}%</p>
          {device.is_active && <span>● Active</span>}
        </div>
      ))}
    </div>
  );
}
```

### Trasferire riproduzione

```tsx
import { useTransferPlaybackMutation } from "@/hooks/useSpotify";

function TransferButton({ deviceId, deviceName }) {
  const transfer = useTransferPlaybackMutation();

  const handleTransfer = () => {
    transfer.mutate({ 
      deviceId, 
      play: true 
    });
  };

  return (
    <button onClick={handleTransfer}>
      Play on {deviceName}
    </button>
  );
}
```

## 🎯 Esempi Avanzati

### Player completo con tutti i controlli

```tsx
import { 
  usePlaybackState,
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useSeekMutation,
  useSetVolumeMutation 
} from "@/hooks/useSpotify";

function FullPlayer() {
  const { data: state } = usePlaybackState();
  const play = usePlayMutation();
  const pause = usePauseMutation();
  const next = useNextMutation();
  const previous = usePreviousMutation();
  const seek = useSeekMutation();
  const setVolume = useSetVolumeMutation();

  const togglePlay = () => {
    if (state?.is_playing) {
      pause.mutate();
    } else {
      play.mutate({});
    }
  };

  return (
    <div className="player">
      {/* Track Info */}
      <div>
        <img src={state?.item?.album.images[0]?.url} />
        <h3>{state?.item?.name}</h3>
        <p>{state?.item?.artists[0]?.name}</p>
      </div>

      {/* Controls */}
      <div>
        <button onClick={() => previous.mutate()}>⏮</button>
        <button onClick={togglePlay}>
          {state?.is_playing ? "⏸" : "▶"}
        </button>
        <button onClick={() => next.mutate()}>⏭</button>
      </div>

      {/* Progress */}
      <input
        type="range"
        min="0"
        max={state?.item?.duration_ms || 0}
        value={state?.progress_ms || 0}
        onChange={(e) => seek.mutate(Number(e.target.value))}
      />

      {/* Volume */}
      <input
        type="range"
        min="0"
        max="100"
        value={state?.device?.volume_percent || 50}
        onChange={(e) => setVolume.mutate(Number(e.target.value))}
      />
    </div>
  );
}
```

### Context Provider personalizzato

```tsx
import { createContext, useContext } from "react";
import { usePlaybackState } from "@/hooks/useSpotify";

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const { data: playback } = usePlaybackState();

  const value = {
    currentTrack: playback?.item,
    isPlaying: playback?.is_playing,
    progress: playback?.progress_ms,
    // Add more state as needed
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}
```

### Error Boundary

```tsx
import { Component } from "react";

class SpotifyErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Spotify Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong with Spotify</h2>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 💡 Tips & Best Practices

### 1. Sempre gestire loading e error states

```tsx
function MyComponent() {
  const { data, isLoading, error } = useSpotify...();

  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return <div>{/* render data */}</div>;
}
```

### 2. Usare React Query per caching

```tsx
// Le query sono automaticamente cachate
const { data } = useTopTracks(); // Cached!
```

### 3. Gestire token scaduti

```tsx
import { isTokenValid, getAuthUrl } from "@/services/spotify-auth";

function ProtectedComponent() {
  if (!isTokenValid()) {
    return (
      <div>
        <p>Session expired</p>
        <a href={getAuthUrl()}>Login again</a>
      </div>
    );
  }

  return <YourComponent />;
}
```

### 4. Debounce per search

```tsx
import { useDebounce } from "@/hooks/use-mobile";

const debouncedQuery = useDebounce(query, 500);
const { data } = useSearch(debouncedQuery);
```

### 5. Ottimistic updates

```tsx
const mutation = useSaveTrackMutation();

mutation.mutate(trackId, {
  onMutate: () => {
    // Update UI immediately
    setIsSaved(true);
  },
  onError: () => {
    // Revert on error
    setIsSaved(false);
  }
});
```

---

**Hai domande? Consulta la [documentazione Spotify](https://developer.spotify.com/documentation/web-api)**
