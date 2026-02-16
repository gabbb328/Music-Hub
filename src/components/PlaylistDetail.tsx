import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, ListPlus, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaylist, usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/mock-data";

interface PlaylistDetailProps {
  playlistId: string;
  onBack: () => void;
}

export default function PlaylistDetail({ playlistId, onBack }: PlaylistDetailProps) {
  const { data: playlist, isLoading } = usePlaylist(playlistId);
  const playMutation = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();

  const handlePlayAll = async () => {
    if (!playlist?.uri) return;
    
    try {
      toast({ title: "Playing playlist...", description: playlist.name });
      await playMutation.mutateAsync({ context_uri: playlist.uri });
      toast({ title: "Now Playing", description: playlist.name });
    } catch (error) {
      toast({ title: "Playback Error", description: "Make sure you have an active device", variant: "destructive" });
    }
  };

  const handlePlayTrack = async (uri: string, name: string) => {
    try {
      toast({ title: "Playing...", description: name });
      await playMutation.mutateAsync({ uris: [uri] });
      toast({ title: "Now Playing", description: name });
    } catch (error) {
      toast({ title: "Playback Error", description: "Make sure you have an active device", variant: "destructive" });
    }
  };

  const handleAddToQueue = async (uri: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToQueueMutation.mutateAsync(uri);
      toast({ title: "✓ Added to queue", description: name });
    } catch (error) {
      toast({ title: "Failed to add to queue", description: "Make sure you have an active device", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Music className="w-20 h-20 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Playlist not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 aspect-square rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {playlist.images?.[0]?.url ? (
              <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Music className="w-20 h-20 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground uppercase">Playlist</p>
              <h1 className="text-4xl md:text-5xl font-bold mt-2">{playlist.name}</h1>
            </div>
            {playlist.description && (
              <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: playlist.description }} />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{playlist.owner.display_name}</span>
              <span>•</span>
              <span>{playlist.tracks.total} songs</span>
            </div>
            <Button size="lg" onClick={handlePlayAll} disabled={playMutation.isPending} className="rounded-full">
              {playMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2 fill-current" />
              )}
              Play
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {playlist.tracks.items.map((item: any, index: number) => {
            const track = item.track;
            if (!track) return null;

            return (
              <div
                key={`${track.id}-${index}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={() => handlePlayTrack(track.uri, track.name)}>
                  <span className="w-8 text-center text-muted-foreground">{index + 1}</span>
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    {track.album?.images?.[0]?.url && (
                      <img src={track.album.images[0].url} alt={track.name} className="object-cover w-full h-full" loading="lazy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{track.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artists?.map((a: any) => a.name).join(", ")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate hidden md:block max-w-xs">
                    {track.album?.name}
                  </p>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {formatTime(Math.floor(track.duration_ms / 1000))}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handlePlayTrack(track.uri, track.name)} disabled={playMutation.isPending}>
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleAddToQueue(track.uri, track.name, e)} disabled={addToQueueMutation.isPending}>
                    <ListPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
