export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage: string;
}

// In-memory translation cache to prevent rate-limit 429s for repeated lines
const translationCache = new Map<string, string>();

export const translateText = async (
  text: string,
  targetLang: string = "it",
  sourceLang: string = "auto"
): Promise<TranslationResult | null> => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const cacheKey = `${sourceLang}_${targetLang}_${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return {
      translatedText: translationCache.get(cacheKey)!,
      targetLanguage: targetLang,
    };
  }

  // 1. Try MyMemory API (Fully CORS-enabled, reliable free translation endpoint)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const pair = sourceLang === "auto" ? `en|${targetLang}` : `${sourceLang}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${pair}`;

    const res = await fetch(myMemoryUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText.trim();
        // Ignore fallback error strings from MyMemory
        if (
          translatedText &&
          !translatedText.includes("IS AN INVALID SRCLANG") &&
          !translatedText.includes("MYMEMORY WARNING")
        ) {
          translationCache.set(cacheKey, translatedText);
          return {
            translatedText,
            detectedLanguage: sourceLang,
            targetLanguage: targetLang,
          };
        }
      }
    }
  } catch (e) {
    // Silent catch, fallback below
  }

  // 2. Fallback to Google Translate client API via CORS Proxy or direct call
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(googleUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translatedText = data[0]
          .map((chunk: any) => (chunk && chunk[0] ? chunk[0] : ""))
          .join("")
          .trim();

        if (translatedText) {
          translationCache.set(cacheKey, translatedText);
          return {
            translatedText,
            detectedLanguage: data[2] || sourceLang,
            targetLanguage: targetLang,
          };
        }
      }
    }
  } catch (e) {
    // Silent catch, fallback below
  }

  // 3. Fallback to Lingva API
  try {
    const lingvaUrl = `https://lingva.ml/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(
      text
    )}`;
    const response = await fetch(lingvaUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.translation) {
        translationCache.set(cacheKey, data.translation);
        return {
          translatedText: data.translation,
          detectedLanguage: sourceLang,
          targetLanguage: targetLang,
        };
      }
    }
  } catch (e) {
    // Silent catch
  }

  // Fallback to original text if translation service unavailable
  return { translatedText: text, targetLanguage: targetLang };
};

export const translateLyrics = async (
  lyrics: string,
  targetLang: string = "it",
  sourceLang: string = "auto"
): Promise<string | null> => {
  if (!lyrics || lyrics.trim().length === 0) {
    return null;
  }

  try {
    const paragraphs = lyrics.split("\n\n").filter((p) => p.trim());
    const translatedParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      const result = await translateText(paragraph, targetLang, sourceLang);
      if (result) {
        translatedParagraphs.push(result.translatedText);
      } else {
        translatedParagraphs.push(paragraph);
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    return translatedParagraphs.join("\n\n");
  } catch (error) {
    console.error("Lyrics translation error:", error);
    return null;
  }
};

export const availableLanguages = [
  { code: "it", name: "Italiano" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
];
