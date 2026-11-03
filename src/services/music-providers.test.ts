import { describe, it, expect, beforeEach } from "vitest";
import {
  MUSIC_PROVIDERS,
  PROVIDER_LIST,
  getActiveProvider,
  setActiveProvider,
  universalAudioEngine,
  CATALOG_TRACKS,
} from "./music-providers";

describe("Music Providers System (v3.0.0)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should list all 8 music streaming providers including Spotify, Apple Music, Tidal, Amazon, YT Music", () => {
    expect(PROVIDER_LIST.length).toBe(8);
    const ids = PROVIDER_LIST.map((p) => p.id);
    expect(ids).toContain("spotify");
    expect(ids).toContain("apple_music");
    expect(ids).toContain("youtube_music");
    expect(ids).toContain("amazon_music");
    expect(ids).toContain("tidal");
    expect(ids).toContain("deezer");
    expect(ids).toContain("soundcloud");
    expect(ids).toContain("qobuz");
  });

  it("should default active provider to spotify", () => {
    expect(getActiveProvider()).toBe("spotify");
  });

  it("should allow changing the active provider to Apple Music and Tidal", () => {
    setActiveProvider("apple_music", { name: "Test Apple User" });
    expect(getActiveProvider()).toBe("apple_music");
    expect(localStorage.getItem("harmony_music_provider")).toBe("apple_music");

    setActiveProvider("tidal", { name: "HiFi Audiophile" });
    expect(getActiveProvider()).toBe("tidal");
  });

  it("UniversalAudioEngine should manage playback and provide valid snapshots", () => {
    setActiveProvider("apple_music");
    const snapshot = universalAudioEngine.getPlaybackStateSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.device).toBeDefined();
    expect(snapshot.device.name).toContain("Apple Music");

    const track = universalAudioEngine.getCurrentTrack();
    expect(track).toBeDefined();
    expect(track?.name).toBeDefined();

    universalAudioEngine.togglePlay();
    expect(universalAudioEngine.getIsPlaying()).toBe(true);

    universalAudioEngine.pause();
    expect(universalAudioEngine.getIsPlaying()).toBe(false);
  });

  it("UniversalAudioEngine should search tracks across catalog", () => {
    const results = universalAudioEngine.search("summer");
    expect(results.tracks.items.length).toBeGreaterThan(0);
  });
});
