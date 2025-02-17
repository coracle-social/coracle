// src/app/i18n/utils.ts
import { languageToCountry } from './types'

export function getFlagEmoji(langCode: string): string {
    const countryCode = languageToCountry[langCode.toLowerCase()];
    if (!countryCode) return `[${langCode.toUpperCase()}]`;
    
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    
    const flag = String.fromCodePoint(...codePoints);
    return flag || `[${langCode.toUpperCase()}]`;
}

export function getAllKeys(obj: any, prefix: string = ''): string[] {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object') {
            return [...acc, ...getAllKeys(value, newKey)]
        }
        return [...acc, newKey]
    }, [])
}

export function getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => 
        current && current[key] !== undefined ? current[key] : '', obj)
}