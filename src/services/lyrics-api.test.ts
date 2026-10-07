import { describe, it, expect } from "vitest";
import {
  parseWordParts,
  parseLRC,
  detectHighPitch,
  detectLowPitch,
  detectVibrato,
} from "./lyrics-api";

describe("Lyrics Word Parsing & Punctuation Separation", () => {
  it("isolates trailing punctuation (, ; . : - _) from the core word", () => {
    const resComma = parseWordParts("amore,");
    expect(resComma.word).toBe("amore");
    expect(resComma.trailPunct).toBe(",");
    expect(resComma.leadPunct).toBe("");
    expect(resComma.isPunctOnly).toBe(false);

    const resSemicolon = parseWordParts("canto;");
    expect(resSemicolon.word).toBe("canto");
    expect(resSemicolon.trailPunct).toBe(";");

    const resColon = parseWordParts("nota:");
    expect(resColon.word).toBe("nota");
    expect(resColon.trailPunct).toBe(":");

    const resPeriod = parseWordParts("fine.");
    expect(resPeriod.word).toBe("fine");
    expect(resPeriod.trailPunct).toBe(".");

    const resDash = parseWordParts("tempo-");
    expect(resDash.word).toBe("tempo");
    expect(resDash.trailPunct).toBe("-");

    const resUnderscore = parseWordParts("voce_");
    expect(resUnderscore.word).toBe("voce");
    expect(resUnderscore.trailPunct).toBe("_");
  });

  it("isolates leading punctuation and symbols (, ; . : - _ () [] quotes)", () => {
    const resParen = parseWordParts("(coro)");
    expect(resParen.leadPunct).toBe("(");
    expect(resParen.word).toBe("coro");
    expect(resParen.trailPunct).toBe(")");
    expect(resParen.isPunctOnly).toBe(false);

    const resLeadDash = parseWordParts("-start");
    expect(resLeadDash.leadPunct).toBe("-");
    expect(resLeadDash.word).toBe("start");
    expect(resLeadDash.trailPunct).toBe("");
  });

  it("correctly identifies punctuation-only tokens so they are never highlighted in karaoke mode", () => {
    const punctOnly1 = parseWordParts("-");
    expect(punctOnly1.isPunctOnly).toBe(true);

    const punctOnly2 = parseWordParts("...");
    expect(punctOnly2.isPunctOnly).toBe(true);

    const punctOnly3 = parseWordParts(", ; :");
    expect(punctOnly3.isPunctOnly).toBe(true);
  });

  it("preserves internal apostrophes in Italian and English contractions", () => {
    const resItalian = parseWordParts("l'amore,");
    expect(resItalian.word).toBe("l'amore");
    expect(resItalian.trailPunct).toBe(",");

    const resEnglish = parseWordParts("don't!");
    expect(resEnglish.word).toBe("don't");
    expect(resEnglish.trailPunct).toBe("!");
  });
});

describe("LRC Parsing & Backing Vocals (Cori) Standardization", () => {
  it("converts [Coro: ...] and [Backing: ...] into round parentheses (...) without icons", () => {
    const lrc = `
[00:10.00] Never gonna give you up
[00:15.00] [Coro: Give you up]
[00:20.00] [Backing: Never gonna let you down]
    `;
    const lines = parseLRC(lrc);
    expect(lines.length).toBe(3);
    expect(lines[0].text).toBe("Never gonna give you up");
    expect(lines[1].text).toBe("(Give you up)");
    expect(lines[2].text).toBe("(Never gonna let you down)");
  });

  it("handles standard LRC offset tags", () => {
    const lrcWithOffset = `
[offset: 500]
[00:10.00] Hello world
    `;
    const lines = parseLRC(lrcWithOffset);
    expect(lines.length).toBe(1);
    expect(lines[0].time).toBe(10.5); // 10s + 0.5s offset
  });
});
