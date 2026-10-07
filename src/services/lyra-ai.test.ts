import { describe, expect, it } from "vitest";
import { buildLyraContext, generateReply, askLyraAI, detectLyraIntent } from "@/services/lyra-ai";
import { parseBpmValue } from "@/services/track-bpm";
import { cleanTrackTitle, cleanArtistName, trackDeduplicationKey } from "@/components/AIPanel";

const playing = {
  name: "Blinding Lights",
  artist: "The Weeknd",
};

describe("buildLyraContext", () => {
  it("usa currentTrack.artist, non artists[0]", () => {
    const ctx = buildLyraContext(playing, null, []);
    expect(ctx.trackName).toBe("Blinding Lights");
    expect(ctx.artistName).toBe("The Weeknd");
  });

  it("non espone undefined come cantante", () => {
    const ctx = buildLyraContext({ name: "Test", artist: "undefined" }, null, []);
    expect(ctx.artistName).toBeNull();
  });

  it("prende il BPM extra quando le audio features Spotify mancano", () => {
    const ctx = buildLyraContext(playing, null, [], 171);
    expect(ctx.bpm).toBe(171);
  });
});

describe("generateReply cantante e BPM", () => {
  const ctx = buildLyraContext(playing, { tempo: 171, energy: 0.8, valence: 0.7 }, []);

  it("risponde con il cantante se chiesto", () => {
    const reply = generateReply("chi è il cantante?", ctx);
    expect(reply.text).toContain("The Weeknd");
    expect(reply.text).not.toContain("undefined");
  });

  it("risponde con i BPM se chiesti", () => {
    const reply = generateReply("quanti bpm ha?", ctx);
    expect(reply.text).toContain("171");
    expect(reply.text).not.toContain("null BPM");
  });

  it("risponde a cantante e BPM insieme", () => {
    const reply = generateReply("dimmi il cantante e i bpm", ctx);
    expect(reply.text).toContain("The Weeknd");
    expect(reply.text).toContain("171");
  });
});

describe("parseBpmValue", () => {
  it("estrae un BPM valido da stringhe", () => {
    expect(parseBpmValue("171 BPM")).toBe(171);
    expect(parseBpmValue(98.6)).toBe(99);
    expect(parseBpmValue("nope")).toBeNull();
  });
});

describe("Deduplicazione Brani Consigliati", () => {
  it("normalizza titoli con feat, remaster e versioni per evitare duplicati", () => {
    const t1 = cleanTrackTitle("Blinding Lights - 2020 Remaster");
    const t2 = cleanTrackTitle("Blinding Lights (Radio Edit)");
    const t3 = cleanTrackTitle("Blinding Lights");
    expect(t1).toBe("blinding lights");
    expect(t2).toBe("blinding lights");
    expect(t3).toBe("blinding lights");
  });

  it("normalizza artista principale isolando collaborazioni e featuring", () => {
    const a1 = cleanArtistName("The Weeknd ft. Daft Punk");
    const a2 = cleanArtistName("The Weeknd, Ariana Grande");
    const a3 = cleanArtistName("The Weeknd");
    expect(a1).toBe("the weeknd");
    expect(a2).toBe("the weeknd");
    expect(a3).toBe("the weeknd");
  });

  it("genera la stessa chiave per versioni identiche dello stesso artista", () => {
    const k1 = trackDeduplicationKey("Starboy", "The Weeknd ft. Daft Punk");
    const k2 = trackDeduplicationKey("Starboy - Remastered", "The Weeknd");
    expect(k1).toBe(k2);
  });
});

describe("askLyraAI - Intelligenza Artificiale Completa", () => {
  const ctx = buildLyraContext(playing, { tempo: 171, energy: 0.8, valence: 0.7 }, []);

  it("intercetta la richiesta di consigli musicali con wantRecommendations", async () => {
    const reply = await askLyraAI("Consigliami qualche brano", ctx);
    expect(reply.wantRecommendations).toBe(true);
    expect(reply.text).toContain("Consigli Personalizzati LyraAI");
  });

  it("risponde a domande aperte (es. chitarra, teoria, barzelletta)", async () => {
    const reply = await askLyraAI("Mi dai consigli per iniziare con la chitarra?", ctx);
    expect(reply.text).toContain("Chitarra");
    expect(reply.text.length).toBeGreaterThan(50);
  });

  it("è in grado di spiegare la scala pentatonica", async () => {
    const reply = await askLyraAI("Spiegami la scala pentatonica", ctx);
    expect(reply.text).toContain("Pentatonica");
  });
});
