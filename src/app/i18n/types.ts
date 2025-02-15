// src/app/i18n/types.ts
export interface TranslationReducer {
    [key: string]: {
        [key: string]: string | object
    }
}

export const languageToCountry: Record<string, string> = {
    fr: 'FR',
    en: 'GB',
    es: 'ES',
    de: 'DE',
    it: 'IT',
    pt: 'PT',
    nl: 'NL',
    ru: 'RU',
    zh: 'CN',
    ja: 'JP',
    ko: 'KR',
    ar: 'SA',
    hi: 'IN',
};

export const supportedLanguages: string[] = ['fr', 'en', 'es', 'de']