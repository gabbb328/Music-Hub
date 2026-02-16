const MYMEMORY_API = "https://api.mymemory.translated.net/get";

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage: string;
}

export const translateText = async (
  text: string,
  targetLang: string = 'it'
): Promise<TranslationResult | null> => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const params = new URLSearchParams({
      q: text,
      langpair: `en|${targetLang}`
    });

    const response = await fetch(`${MYMEMORY_API}?${params.toString()}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('MyMemory API error:', response.status);
      return fallbackTranslate(text, targetLang);
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        translatedText: data.responseData.translatedText,
        detectedLanguage: 'en',
        targetLanguage: targetLang
      };
    }

    return fallbackTranslate(text, targetLang);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Translation timeout');
    } else {
      console.error('Translation error:', error);
    }
    return fallbackTranslate(text, targetLang);
  }
};

async function fallbackTranslate(text: string, targetLang: string): Promise<TranslationResult | null> {
  try {
    const LINGVA_API = `https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(text)}`;
    
    const response = await fetch(LINGVA_API);
    if (!response.ok) {
      return { translatedText: text, targetLanguage: targetLang };
    }

    const data = await response.json();
    
    if (data.translation) {
      return {
        translatedText: data.translation,
        detectedLanguage: 'en',
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
  targetLang: string = 'it'
): Promise<string | null> => {
  if (!lyrics || lyrics.trim().length === 0) {
    return null;
  }

  try {
    const paragraphs = lyrics.split('\n\n').filter(p => p.trim());
    const translatedParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      const result = await translateText(paragraph, targetLang);
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
