import { derived, writable, get } from 'svelte/store'
import type { Writable } from 'svelte/store'
import fr from '../i18n/lang/fr.json'
import en from '../i18n/lang/en.json'
import es from '../i18n/lang/es.json'
import de from '../i18n/lang/de.json'

// Déclarer translations AVANT les interfaces
const translations = { fr, en, es, de }

// Définition des types
interface Translation {
   [key: string]: any;
}

interface TranslateOptions {
   default?: string;
   [key: string]: any;
}

interface TranslationStore {
   [key: string]: Translation;
}

interface I18nStore {
   locale: string;
   t: (key: string, options?: TranslateOptions) => string;
   setLocale: (newLocale: string) => void;
   addTranslation: (key: string, values: {[locale: string]: string}) => void;
   getAvailableLocales: () => string[];
   exportTranslations: () => void;
   importTranslations: (file: File) => Promise<void>;
   getStaticTranslations: () => typeof translations;
   getDynamicTranslations: () => TranslationStore;
}

function createI18nStore() {
   const currentLocale = writable<string>(
       window.navigator.language.split('-')[0] || 'en'
   )

   const dynamicTranslations = writable<TranslationStore>({})

   // Fonction utilitaire pour obtenir une valeur imbriquée
   function getNestedValue(obj: any, path: string): any {
       return path.split('.').reduce((current, key) => 
           current && current[key] !== undefined ? current[key] : null, obj)
   }

   // Fonction utilitaire pour définir une valeur imbriquée
   function setNestedValue(obj: any, path: string, value: any): void {
       const keys = path.split('.')
       let current = obj
       for (let i = 0; i < keys.length - 1; i++) {
           if (!current[keys[i]]) current[keys[i]] = {}
           current = current[keys[i]]
       }
       current[keys[keys.length - 1]] = value
   }

   const i18n = derived<[Writable<string>, Writable<TranslationStore>], I18nStore>(
       [currentLocale, dynamicTranslations],
       ([$currentLocale, $dynamicTranslations]) => ({
           locale: $currentLocale,
           t: (key: string, options: TranslateOptions = {}) => {
               // Cherche d'abord dans les traductions dynamiques
               const dynamicValue = getNestedValue($dynamicTranslations[$currentLocale] || {}, key)
               if (dynamicValue) return dynamicValue

               // Si pas trouvé, cherche dans les traductions statiques
               const staticValue = getNestedValue(translations[$currentLocale], key)
               return staticValue || options.default || key
           },
           setLocale: (newLocale: string) => {
               if (translations[newLocale]) {
                   currentLocale.set(newLocale)
               }
           },
           addTranslation: (key: string, values: {[locale: string]: string}) => {
               dynamicTranslations.update(current => {
                   const updated = { ...current }
                   Object.entries(values).forEach(([locale, text]) => {
                       if (!updated[locale]) updated[locale] = {}
                       setNestedValue(updated[locale], key, text)
                   })
                   return updated
               })
               localStorage.setItem('dynamicTranslations', JSON.stringify(get(dynamicTranslations)))
           },
           getAvailableLocales: () => Object.keys(translations),
           exportTranslations: () => {
            const allTranslations = {
                static: translations,  // traductions statiques existantes
                dynamic: get(dynamicTranslations)  // traductions dynamiques actuelles
            }
            const blob = new Blob([JSON.stringify(allTranslations, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'translations.json'
            a.click()
            URL.revokeObjectURL(url)
            },
           importTranslations: async (file: File): Promise<void> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const content = e.target?.result as string
                        const parsed = JSON.parse(content)
                        // Si le fichier importé contient les deux types de traductions
                        if (parsed.static && parsed.dynamic) {
                            // Mettre à jour les traductions dynamiques
                            dynamicTranslations.set(parsed.dynamic)
                            // Les traductions statiques restent inchangées car elles viennent des fichiers JSON
                        } else {
                            // Si c'est un ancien format, tout mettre dans dynamic
                            dynamicTranslations.set(parsed)
                        }
                        localStorage.setItem('dynamicTranslations', JSON.stringify(get(dynamicTranslations)))
                        resolve()
                    } catch (error) {
                        reject(error)
                    }
                }
                reader.onerror = () => reject(reader.error)
                reader.readAsText(file)
            })
        },
           getStaticTranslations: () => translations,
           getDynamicTranslations: () => get(dynamicTranslations)
           
       })
   )

   return i18n
}

export const i18n = createI18nStore()





