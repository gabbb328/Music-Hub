import { useState, useEffect, useRef } from "react";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export function useVideoFinder(trackName: string, artistName: string) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const lastTrack = useRef<string | null>(null);

  useEffect(() => {
    const key = `${trackName}||${artistName}`;
    if (!trackName || !artistName || key === lastTrack.current) return;
    lastTrack.current = key;
    setVideoUrl(null);

    (async () => {
      try {
        const query = encodeURIComponent(
          `${artistName} ${trackName} official music video`,
        );
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoEmbeddable=true&maxResults=1&key=${YOUTUBE_API_KEY}`,
        );
        const data = await res.json();
        const id = data.items?.[0]?.id?.videoId;
        if (id) setVideoUrl(`https://www.youtube-nocookie.com/embed/${id}`);
      } catch {
        setVideoUrl(null);
      }
    })();
  }, [trackName, artistName]);

  return videoUrl;
}
