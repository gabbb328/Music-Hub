const bpmCache = new Map<string, number>();

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function parseBpmValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value);
    return rounded >= 40 && rounded <= 250 ? rounded : null;
  }
  if (typeof value === "string") {
    const match = value.match(/(\d{2,3})(?:\.\d+)?/);
    if (!match) return null;
    const rounded = Math.round(Number(match[1]));
    return rounded >= 40 && rounded <= 250 ? rounded : null;
  }
  return null;
}

function cacheKey(title: string, artist: string) {
  return `${normalize(title)}|${normalize(artist)}`;
}

async function lookupDeezerBpm(title: string, artist: string): Promise<number | null> {
  const query = encodeURIComponent(`${artist} ${title}`);
  const searchRes = await fetch(`https://api.deezer.com/search?q=${query}&limit=8`);
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const items: any[] = Array.isArray(searchData?.data) ? searchData.data : [];
  if (items.length === 0) return null;

  const titleKey = normalize(title);
  const artistKey = normalize(artist).split(" ")[0];
  const match =
    items.find((track) => {
      const trackTitle = normalize(track?.title || "");
      const trackArtist = normalize(track?.artist?.name || "");
      return (
        (trackTitle === titleKey || trackTitle.includes(titleKey) || titleKey.includes(trackTitle)) &&
        (!artistKey || trackArtist.includes(artistKey))
      );
    }) || items[0];

  const direct = parseBpmValue(match?.bpm);
  if (direct) return direct;
  if (!match?.id) return null;

  const trackRes = await fetch(`https://api.deezer.com/track/${match.id}`);
  if (!trackRes.ok) return null;
  const track = await trackRes.json();
  return parseBpmValue(track?.bpm);
}

async function lookupAiBpm(title: string, artist: string): Promise<number | null> {
  const prompt = `Qual è il tempo in BPM della canzone "${title}" di "${artist}"? Rispondi SOLO con un numero intero, senza testo.`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`,
      { signal: controller.signal }
    );
    if (!response.ok) return null;
    const text = await response.text();
    return parseBpmValue(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function lookupTrackBpm(title: string, artist: string): Promise<number | null> {
  if (!title?.trim() || !artist?.trim()) return null;

  const key = cacheKey(title, artist);
  const cached = bpmCache.get(key);
  if (cached) return cached;

  try {
    const deezerBpm = await lookupDeezerBpm(title, artist);
    if (deezerBpm) {
      bpmCache.set(key, deezerBpm);
      return deezerBpm;
    }
  } catch {
    // Deezer può fallire per CORS/rete: si passa all'AI
  }

  try {
    const aiBpm = await lookupAiBpm(title, artist);
    if (aiBpm) {
      bpmCache.set(key, aiBpm);
      return aiBpm;
    }
  } catch {
    return null;
  }

  return null;
}
