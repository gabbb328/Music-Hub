import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as spotifyApi from "@/services/spotify-api";
import { getToken } from "@/services/spotify-auth";

export const useCurrentlyPlaying = () => useQuery({
  queryKey: ["currentlyPlaying"],
  queryFn: spotifyApi.getCurrentlyPlaying,
  refetchInterval: 1000,
  enabled: !!getToken(), retry: 1,
});

export const usePlaybackState = () => useQuery({
  queryKey: ["playbackState"],
  queryFn: spotifyApi.getPlaybackState,
  refetchInterval: 1000,
  enabled: !!getToken(), retry: 1,
});

export const useRecentlyPlayed = (limit = 20) => useQuery({
  queryKey: ["recentlyPlayed", limit],
  queryFn: () => spotifyApi.getRecentlyPlayed(limit),
  enabled: !!getToken(), staleTime: 30000,
});

export const useTopTracks = (timeRange: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 50) => useQuery({
  queryKey: ["topTracks", timeRange, limit],
  queryFn: () => spotifyApi.getTopTracks(timeRange, limit),
  enabled: !!getToken(), staleTime: 300000,
});

export const useTopArtists = (timeRange: "short_term"|"medium_term"|"long_term" = "medium_term", limit = 50) => useQuery({
  queryKey: ["topArtists", timeRange, limit],
  queryFn: () => spotifyApi.getTopArtists(timeRange, limit),
  enabled: !!getToken(), staleTime: 300000,
});

export const useUserPlaylists = () => useQuery({
  queryKey: ["userPlaylists"],
  queryFn: spotifyApi.getUserPlaylists,
  enabled: !!getToken(), staleTime: 60000,
});

export const usePlaylist = (playlistId: string) => useQuery({
  queryKey: ["playlist", playlistId],
  queryFn: () => spotifyApi.getPlaylist(playlistId),
  enabled: !!getToken() && !!playlistId, staleTime: 60000,
});

export const useSavedTracks = (limit?: number) => useQuery({
  queryKey: ["savedTracks", limit ?? "all"],
  queryFn: () => spotifyApi.getSavedTracks(limit),
  enabled: !!getToken(), staleTime: 30000,
});

export const useAllPlaylistTracks = (playlistId: string, totalTracks: number) => useQuery({
  queryKey: ["playlistTracks", playlistId],
  queryFn: () => spotifyApi.getAllPlaylistTracks(playlistId),
  enabled: !!getToken() && !!playlistId && totalTracks > 100, staleTime: 60000,
});

export const useUserProfile = () => useQuery({
  queryKey: ["userProfile"],
  queryFn: spotifyApi.getUserProfile,
  enabled: !!getToken(), staleTime: Infinity,
});

export const useAvailableDevices = () => useQuery({
  queryKey: ["availableDevices"],
  queryFn: spotifyApi.getAvailableDevices,
  refetchInterval: 5000,
  enabled: !!getToken(), retry: 1,
});

export const useSearch = (query: string, type: string[] = ["track","artist","album","playlist"], limit = 20) => {
  const trimmed = query?.trim() || "";
  return useQuery({
    queryKey: ["search", trimmed, type, limit],
    queryFn: () => spotifyApi.search(trimmed, type, limit),
    enabled: !!getToken() && trimmed.length >= 2,
    staleTime: 60000, retry: 2, retryDelay: 1000,
  });
};

export const useQueue = () => useQuery({
  queryKey: ["queue"],
  queryFn: spotifyApi.getQueue,
  refetchInterval: 5000,
  enabled: !!getToken(), retry: 1,
});

export const useAudioFeatures = (trackId: string) => useQuery({
  queryKey: ["audioFeatures", trackId],
  queryFn: () => spotifyApi.getAudioFeatures(trackId),
  enabled: !!getToken() && !!trackId, staleTime: Infinity,
});

export const useCheckSavedTracks = (trackIds: string[]) => useQuery({
  queryKey: ["checkSavedTracks", ...trackIds],
  queryFn: () => spotifyApi.checkSavedTracks(trackIds),
  enabled: !!getToken() && trackIds.length > 0, staleTime: 30000,
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const usePlayMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      deviceId?: string;
      contextUri?: string;
      uris?: string[];
      offset?: { position: number } | { uri: string };
    }) => spotifyApi.play(params.deviceId, params.contextUri, params.uris, params.offset),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbackState"] });
      qc.invalidateQueries({ queryKey: ["currentlyPlaying"] });
    },
    retry: 1,
  });
};

export const usePauseMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: spotifyApi.pause, onSuccess: () => { qc.invalidateQueries({ queryKey: ["playbackState"] }); } });
};

export const useNextMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: spotifyApi.next, onSuccess: () => { qc.invalidateQueries({ queryKey: ["playbackState"] }); } });
};

export const usePreviousMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: spotifyApi.previous, onSuccess: () => { qc.invalidateQueries({ queryKey: ["playbackState"] }); } });
};

export const useSeekMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (ms: number) => spotifyApi.seek(ms), onSuccess: () => { qc.invalidateQueries({ queryKey: ["playbackState"] }); } });
};

export const useSetVolumeMutation = () => useMutation({ mutationFn: (v: number) => spotifyApi.setVolume(v) });

export const useShuffleMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (s: boolean) => spotifyApi.setShuffle(s), onSuccess: () => { qc.invalidateQueries({ queryKey: ["playbackState"] }); } });
};

export const useRepeatMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (s: "track"|"context"|"off") => spotifyApi.setRepeat(s), onSuccess: () => { qc.invalidateQueries({ queryKey: ["playbackState"] }); } });
};

export const useSaveTrackMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => spotifyApi.saveTrack(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["savedTracks"] }); } });
};

export const useRemoveTrackMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => spotifyApi.removeTrack(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["savedTracks"] }); } });
};

export const useAddToQueueMutation = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (uri: string) => spotifyApi.addToQueue(uri), onSuccess: () => { qc.invalidateQueries({ queryKey: ["queue"] }); } });
};

export const useTransferPlaybackMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, play }: { deviceId: string; play?: boolean }) => spotifyApi.transferPlayback(deviceId, play),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["playbackState"] }); qc.invalidateQueries({ queryKey: ["availableDevices"] }); },
  });
};

export const useCreatePlaylistMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, trackUris }: { name: string; description?: string; trackUris?: string[] }) => {
      const playlist = await spotifyApi.createPlaylist(name, description ?? "", false);
      if (trackUris && trackUris.length > 0 && playlist?.id) {
        await spotifyApi.addTracksToPlaylist(playlist.id, trackUris);
      }
      return playlist;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userPlaylists"] }); },
  });
};

export const useAddTracksToPlaylistMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, uris }: { playlistId: string; uris: string[] }) =>
      spotifyApi.addTracksToPlaylist(playlistId, uris),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userPlaylists"] }); },
  });
};

export const useSearchTrackMutation = () => useMutation({
  mutationFn: ({ title, artist }: { title: string; artist: string }) =>
    spotifyApi.searchTrackByTitleArtist(title, artist),
});

export const useLikeTrackMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, liked }: { trackId: string; liked: boolean }) =>
      liked ? spotifyApi.likeTrack(trackId) : spotifyApi.unlikeTrack(trackId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["savedTracks"] }); qc.invalidateQueries({ queryKey: ["checkSavedTracks"] }); },
  });
};
