import { safeFetch } from '../../utils/safeFetch';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

class TranslationService {
  async translateText(text: string, targetLang: string): Promise<string> {
    if (!text.trim()) return '';

    try {
      // Use Google Translate API endpoint via safeFetch proxy
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await safeFetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json[0]) {
          return json[0].map((item: any) => item[0]).join('');
        }
      }
    } catch (e) {
      console.warn('Direct translation API failed, fallback translation applied', e);
    }

    // Fallback translation representation
    return `[${targetLang.toUpperCase()} Translation]:\n` + text;
  }
}

export const translationService = new TranslationService();
