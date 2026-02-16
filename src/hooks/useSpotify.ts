import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as spotifyApi from "@/services/spotify-api";
import { getToken } from "@/services/spotify-auth";

export const useCurrentlyPlaying = () => {
  return useQuery({
    queryKey: ["currentlyPlaying"],
    queryFn: spotifyApi.getCurrentlyPlaying,
    refetchInterval: 1000,
    enabled: !!getToken(),
    retry: 1,
  });
};

export const usePlaybackState = () => {
  return useQuery({
    queryKey: ["playbackState"],
    queryFn: spotifyApi.getPlaybackState,
    refetchInterval: 1000,
    enabled: !!getToken(),
    retry: 1,
  });
};

export const useRecentlyPlayed = (limit: number = 20) => {
  return useQuery({
    queryKey: ["recentlyPlayed", limit],
    queryFn: () => spotifyApi.getRecentlyPlayed(limit),
    enabled: !!getToken(),
    staleTime: 30000, // 30 seconds
  });
};

export const useTopTracks = (
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 20,
) => {
  return useQuery({
    queryKey: ["topTracks", timeRange, limit],
    queryFn: () => spotifyApi.getTopTracks(timeRange, limit),
    enabled: !!getToken(),
    staleTime: 300000, // 5 minutes
  });
};

export const useTopArtists = (
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 20,
) => {
  return useQuery({
    queryKey: ["topArtists", timeRange, limit],
    queryFn: () => spotifyApi.getTopArtists(timeRange, limit),
    enabled: !!getToken(),
    staleTime: 300000, // 5 minutes
  });
};

export const useUserPlaylists = () => {
  return useQuery({
    queryKey: ["userPlaylists"],
    queryFn: spotifyApi.getUserPlaylists,
    enabled: !!getToken(),
    staleTime: 60000, // 1 minute
  });
};

export const usePlaylist = (playlistId: string) => {
  return useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: () => spotifyApi.getPlaylist(playlistId),
    enabled: !!getToken() && !!playlistId,
    staleTime: 60000,
  });
};

export const useSavedTracks = (limit: number = 50) => {
  return useQuery({
    queryKey: ["savedTracks", limit],
    queryFn: () => spotifyApi.getSavedTracks(limit),
    enabled: !!getToken(),
    staleTime: 30000,
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: spotifyApi.getUserProfile,
    enabled: !!getToken(),
    staleTime: Infinity, // Profile rarely changes
  });
};

export const useAvailableDevices = () => {
  return useQuery({
    queryKey: ["availableDevices"],
    queryFn: spotifyApi.getAvailableDevices,
    refetchInterval: 5000,
    enabled: !!getToken(),
    retry: 1,
  });
};

export const useSearch = (
  query: string,
  type: string[] = ["track", "artist", "album", "playlist"],
  limit: number = 20,
) => {
  const trimmedQuery = query?.trim() || "";

  return useQuery({
    queryKey: ["search", trimmedQuery, type, limit],
    queryFn: () => spotifyApi.search(trimmedQuery, type, limit),
    enabled: !!getToken() && trimmedQuery.length >= 2,
    staleTime: 60000, // 1 minute
    retry: 2,
    retryDelay: 1000,
  });
};

export const useQueue = () => {
  return useQuery({
    queryKey: ["queue"],
    queryFn: spotifyApi.getQueue,
    refetchInterval: 5000,
    enabled: !!getToken(),
    retry: 1,
  });
};

export const useAudioFeatures = (trackId: string) => {
  return useQuery({
    queryKey: ["audioFeatures", trackId],
    queryFn: () => spotifyApi.getAudioFeatures(trackId),
    enabled: !!getToken() && !!trackId,
    staleTime: Infinity, // Audio features don't change
  });
};

// Mutations
export const usePlayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deviceId,
      contextUri,
      uris,
    }: {
      deviceId?: string;
      contextUri?: string;
      uris?: string[];
    }) => spotifyApi.play(deviceId, contextUri, uris),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
      queryClient.invalidateQueries({ queryKey: ["currentlyPlaying"] });
    },
    retry: 1,
  });
};

export const usePauseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: spotifyApi.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
      queryClient.invalidateQueries({ queryKey: ["currentlyPlaying"] });
    },
  });
};

export const useNextMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: spotifyApi.next,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
      queryClient.invalidateQueries({ queryKey: ["currentlyPlaying"] });
    },
  });
};

export const usePreviousMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: spotifyApi.previous,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
      queryClient.invalidateQueries({ queryKey: ["currentlyPlaying"] });
    },
  });
};

export const useSeekMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionMs: number) => spotifyApi.seek(positionMs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
    },
  });
};

export const useSetVolumeMutation = () => {
  return useMutation({
    mutationFn: (volumePercent: number) => spotifyApi.setVolume(volumePercent),
  });
};

export const useShuffleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (state: boolean) => spotifyApi.setShuffle(state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
    },
  });
};

export const useRepeatMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (state: "track" | "context" | "off") =>
      spotifyApi.setRepeat(state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
    },
  });
};

export const useSaveTrackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => spotifyApi.saveTrack(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedTracks"] });
    },
  });
};

export const useRemoveTrackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => spotifyApi.removeTrack(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedTracks"] });
    },
  });
};

export const useAddToQueueMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uri: string) => spotifyApi.addToQueue(uri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
};

export const useTransferPlaybackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, play }: { deviceId: string; play?: boolean }) =>
      spotifyApi.transferPlayback(deviceId, play),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbackState"] });
      queryClient.invalidateQueries({ queryKey: ["availableDevices"] });
    },
  });
};

export const useCheckSavedTracks = (trackIds: string[]) => {
  return useQuery({
    queryKey: ["checkSavedTracks", ...trackIds],
    queryFn: () => spotifyApi.checkSavedTracks(trackIds),
    enabled: !!getToken() && trackIds.length > 0,
    staleTime: 30000,
  });
};