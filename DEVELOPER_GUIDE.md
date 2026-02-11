# 👨‍💻 Developer Guide - Harmony Hub

Quick reference per sviluppatori che vogliono estendere o modificare Harmony Hub.

## 🏗️ Architettura

```
src/
├── services/           # API & Auth
│   ├── spotify-auth.ts    # OAuth, token management
│   └── spotify-api.ts     # Spotify Web API wrapper
├── hooks/              # React Hooks
│   ├── useSpotify.ts      # Data fetching hooks
│   ├── useSpotifyPlayer.ts # Web Playback SDK
│   └── usePlayerStore.ts   # Local player state
├── contexts/           # React Context
│   └── SpotifyContext.tsx  # Global Spotify state
├── types/              # TypeScript
│   └── spotify.ts          # Spotify types
├── components/         # UI Components
└── pages/              # Routes
```

## 🔑 Environment Variables

```env
# Required
VITE_SPOTIFY_CLIENT_ID=your_client_id

# Optional (default shown)
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

## 🎣 Hooks Usage

### Data Fetching

```tsx
// Queries (auto-cached, auto-refetched)
usePlaybackState()      // Current playback
useCurrentlyPlaying()   // Now playing
useRecentlyPlayed()     // Recently played
useTopTracks()          // Top tracks
useTopArtists()         // Top artists
useUserPlaylists()      // User playlists
usePlaylist(id)         // Playlist details
useSavedTracks()        // Saved/liked tracks
useUserProfile()        // User profile
useAvailableDevices()   // Available devices
useSearch(query)        // Search
useQueue()              // Current queue
```

### Mutations

```tsx
// Playback control
usePlayMutation()       // Play
usePauseMutation()      // Pause
useNextMutation()       // Skip next
usePreviousMutation()   // Skip previous
useSeekMutation()       // Seek position
useSetVolumeMutation()  // Set volume
useShuffleMutation()    // Toggle shuffle
useRepeatMutation()     // Set repeat mode

// Library
useSaveTrackMutation()      // Save track
useRemoveTrackMutation()    // Remove track
useAddToQueueMutation()     // Add to queue
useTransferPlaybackMutation() // Transfer playback
```

## 📝 TypeScript Types

```tsx
import { 
  SpotifyTrack,
  SpotifyPlaybackState,
  SpotifyPlaylist,
  SpotifyDevice,
  SpotifyUser,
  SpotifyAudioFeatures 
} from "@/types/spotify";
```

## 🎨 Adding New Features

### 1. Aggiungi endpoint API

```tsx
// src/services/spotify-api.ts
export const getNewEndpoint = () => 
  spotifyFetch("/new/endpoint");
```

### 2. Crea hook

```tsx
// src/hooks/useSpotify.ts
export const useNewFeature = () => {
  return useQuery({
    queryKey: ["newFeature"],
    queryFn: spotifyApi.getNewEndpoint,
    enabled: !!getToken(),
  });
};
```

### 3. Usa nel componente

```tsx
import { useNewFeature } from "@/hooks/useSpotify";

function MyComponent() {
  const { data, isLoading } = useNewFeature();
  // Use data...
}
```

## 🔐 Authentication Flow

```
User clicks "Login"
  ↓
Redirect to Spotify
  ↓
User authorizes
  ↓
Redirect to /callback
  ↓
Extract token from URL
  ↓
Save to localStorage
  ↓
Redirect to /
  ↓
App loads with token
```

### Token Management

```tsx
import { 
  getToken,        // Get current token
  setToken,        // Save token
  removeToken,     // Clear token
  isTokenValid,    // Check if valid
  getAuthUrl       // Get OAuth URL
} from "@/services/spotify-auth";
```

## 🎵 Web Playback SDK

```tsx
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

function MyPlayer() {
  const {
    player,         // SDK instance
    deviceId,       // Device ID
    isReady,        // SDK ready?
    isPaused,       // Paused?
    currentTrack,   // Current track
    togglePlay,     // Toggle play/pause
    nextTrack,      // Next
    previousTrack,  // Previous
    seek,           // Seek (ms)
    setVolume       // Volume (0-100)
  } = useSpotifyPlayer();
}
```

## 🌐 Context Usage

```tsx
import { useSpotifyContext } from "@/contexts/SpotifyContext";

function MyComponent() {
  const {
    player,
    deviceId,
    isReady,
    playbackState,
    isPlaying,
    currentTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume
  } = useSpotifyContext();
}
```

## 🎨 Component Patterns

### Loading State

```tsx
function MyComponent() {
  const { data, isLoading, error } = useSpotifyHook();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState />;
  if (!data) return <EmptyState />;
  
  return <DataView data={data} />;
}
```

### Error Handling

```tsx
const mutation = usePlayMutation();

mutation.mutate(data, {
  onSuccess: () => {
    toast.success("Success!");
  },
  onError: (error) => {
    toast.error("Failed!");
    console.error(error);
  }
});
```

### Optimistic Updates

```tsx
const [liked, setLiked] = useState(false);
const saveMutation = useSaveTrackMutation();

const handleLike = () => {
  setLiked(true); // Update UI immediately
  
  saveMutation.mutate(trackId, {
    onError: () => {
      setLiked(false); // Revert on error
    }
  });
};
```

## 🧪 Testing

### Test Setup (TODO)

```bash
npm run test
```

### Example Test

```tsx
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

test("renders player", () => {
  render(
    <QueryClientProvider client={queryClient}>
      <Player />
    </QueryClientProvider>
  );
  
  expect(screen.getByText(/play/i)).toBeInTheDocument();
});
```

## 📦 Building

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production

```bash
npm run preview
```

## 🐛 Debugging

### Enable Debug Mode

```tsx
// In vite.config.ts
export default defineConfig({
  define: {
    __SPOTIFY_DEBUG__: true
  }
});
```

### Console Logs

```tsx
// All Spotify API calls are logged
if (__SPOTIFY_DEBUG__) {
  console.log("API call:", endpoint, data);
}
```

### React Query DevTools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools />
    </>
  );
}
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Set in your hosting platform:

```env
VITE_SPOTIFY_CLIENT_ID=your_production_client_id
VITE_SPOTIFY_REDIRECT_URI=https://yourdomain.com/callback
```

### Update Spotify Dashboard

Add production redirect URI to your Spotify app settings.

## 📚 Useful Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check
```

## 🔧 Common Tasks

### Add New Spotify Scope

```tsx
// src/services/spotify-auth.ts
const SCOPES = [
  // ... existing scopes
  "new-scope-here"
].join(" ");
```

### Change Refetch Interval

```tsx
export const usePlaybackState = () => {
  return useQuery({
    queryKey: ["playbackState"],
    queryFn: spotifyApi.getPlaybackState,
    refetchInterval: 2000, // Change this
    enabled: !!getToken(),
  });
};
```

### Add Custom API Endpoint

```tsx
// 1. Add to spotify-api.ts
export const customEndpoint = (param: string) => 
  spotifyFetch(`/custom/${param}`);

// 2. Create hook
export const useCustomData = (param: string) => {
  return useQuery({
    queryKey: ["custom", param],
    queryFn: () => spotifyApi.customEndpoint(param),
    enabled: !!getToken() && !!param,
  });
};

// 3. Use in component
const { data } = useCustomData("test");
```

## 📖 Resources

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [Web Playback SDK Docs](https://developer.spotify.com/documentation/web-playback-sdk)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com)

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 Code Style

- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc comments for complex functions

## 🎯 Performance Tips

1. **Lazy load components**
```tsx
const Heavy = lazy(() => import("./Heavy"));
```

2. **Memoize expensive computations**
```tsx
const filtered = useMemo(
  () => data.filter(expensive),
  [data]
);
```

3. **Debounce user input**
```tsx
const debounced = useDebounce(input, 500);
```

4. **Use React Query cache**
```tsx
// Automatic caching & deduplication
const { data } = useQuery(...);
```

---

**Happy coding! 🚀**
