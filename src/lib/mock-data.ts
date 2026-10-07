import albumCover1 from "@/assets/album-cover-1.jpg";
import albumCover2 from "@/assets/album-cover-2.jpg";
import albumCover3 from "@/assets/album-cover-3.jpg";
import albumCover4 from "@/assets/album-cover-4.jpg";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number; // seconds
  bpm?: number;
}

export interface Playlist {
  id: string;
  name: string;
  cover: string;
  trackCount: number;
  description: string;
}

export interface Device {
  id: string;
  name: string;
  type: "desktop" | "phone" | "speaker" | "echo";
  isActive: boolean;
}

export const mockTracks: Track[] = [
  { id: "1", title: "Midnight Echoes", artist: "Luna Waves", album: "Neon Dreams", cover: albumCover1, duration: 234, bpm: 120 },
  { id: "2", title: "Velvet Horizon", artist: "Skyline", album: "City Lights", cover: albumCover2, duration: 198, bpm: 128 },
  { id: "3", title: "Golden Hour", artist: "Aether", album: "Solstice", cover: albumCover3, duration: 267, bpm: 95 },
  { id: "4", title: "Cloud Nine", artist: "Pastel Dreams", album: "Ethereal", cover: albumCover4, duration: 312, bpm: 110 },
  { id: "5", title: "Deep Current", artist: "Luna Waves", album: "Neon Dreams", cover: albumCover1, duration: 189, bpm: 135 },
  { id: "6", title: "Skyward", artist: "Skyline", album: "City Lights", cover: albumCover2, duration: 245, bpm: 118 },
  { id: "7", title: "Amber Light", artist: "Aether", album: "Solstice", cover: albumCover3, duration: 210, bpm: 100 },
  { id: "8", title: "Soft Landing", artist: "Pastel Dreams", album: "Ethereal", cover: albumCover4, duration: 278, bpm: 90 },
];

export const mockPlaylists: Playlist[] = [
  { id: "1", name: "Focus Flow", cover: albumCover3, trackCount: 42, description: "Deep concentration" },
  { id: "2", name: "Night Drive", cover: albumCover2, trackCount: 28, description: "Late night vibes" },
  { id: "3", name: "Morning Energy", cover: albumCover4, trackCount: 35, description: "Start your day right" },
  { id: "4", name: "Chill Lounge", cover: albumCover1, trackCount: 56, description: "Relax and unwind" },
  { id: "5", name: "Workout Beast", cover: albumCover2, trackCount: 31, description: "High energy pump" },
  { id: "6", name: "Indie Discoveries", cover: albumCover4, trackCount: 24, description: "Fresh new sounds" },
];

export const mockDevices: Device[] = [
  { id: "1", name: "MacBook Pro", type: "desktop", isActive: true },
  { id: "2", name: "iPhone 15", type: "phone", isActive: false },
  { id: "3", name: "Echo Studio", type: "echo", isActive: false },
  { id: "4", name: "Living Room Speaker", type: "speaker", isActive: false },
];

export const recentlyPlayed = mockTracks.slice(0, 6);

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};
