export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage: string;
}

export const translateText = async (
  text: string,
  targetLang: string = 'it',
  sourceLang: string = 'auto'
): Promise<TranslationResult | null> => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Google Translate Public Client REST API (supports sl=auto, completely free, no API keys, extremely fast)
    const GOOGLE_API = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(GOOGLE_API, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallbackTranslate(text, targetLang, sourceLang);
    }

    const data = await response.json();

    // Parse the multi-chunk nested translation matrix from Google
    if (data && data[0] && Array.isArray(data[0])) {
      const translatedText = data[0]
        .map((chunk: any) => chunk && chunk[0] ? chunk[0] : "")
        .join("")
        .trim();
        
      const detectedLanguage = data[2] || sourceLang;

      if (translatedText) {
        return {
          translatedText,
          detectedLanguage,
          targetLanguage: targetLang
        };
      }
    }

    return fallbackTranslate(text, targetLang, sourceLang);
  } catch (error: any) {
    return fallbackTranslate(text, targetLang, sourceLang);
  }
};

async function fallbackTranslate(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<TranslationResult | null> {
  try {
    const LINGVA_API = `https://lingva.ml/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`;
    
    const response = await fetch(LINGVA_API);
    if (!response.ok) {
      return { translatedText: text, targetLanguage: targetLang };
    }

    const data = await response.json();
    
    if (data.translation) {
      return {
        translatedText: data.translation,
        detectedLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }

    return { translatedText: text, targetLanguage: targetLang };
  } catch (e) {
    return { translatedText: text, targetLanguage: targetLang };
  }
}

export const translateLyrics = async (
  lyrics: string,
  targetLang: string = 'it',
  sourceLang: string = 'auto'
): Promise<string | null> => {
  if (!lyrics || lyrics.trim().length === 0) {
    return null;
  }

  try {
    const paragraphs = lyrics.split('\n\n').filter(p => p.trim());
    const translatedParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      const result = await translateText(paragraph, targetLang, sourceLang);
      if (result) {
        translatedParagraphs.push(result.translatedText);
      } else {
        translatedParagraphs.push(paragraph);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return translatedParagraphs.join('\n\n');
  } catch (error) {
    console.error('Lyrics translation error:', error);
    return null;
  }
};

export const availableLanguages = [
  { code: 'it', name: 'Italiano' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
];
