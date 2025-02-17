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
   importTranslations: (file: File) => Promise<void>;
   getStaticTranslations: () => typeof translations;
   getDynamicTranslations: () => TranslationStore;
   deleteTranslation: (key: string) => void;
   updateTranslation: (locale: string, key: string, value: string) => void;
   renameTranslationKey: (oldKey: string, newKey: string) => void;
   exportTranslations: (keys: string[], visibleLanguages: string[]) => void;
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
               console.log('Ajout de la traduction :', { key, values });
               
               dynamicTranslations.update(current => {
                   const updated = { ...current }
                   Object.entries(values).forEach(([locale, text]) => {
                       if (!updated[locale]) updated[locale] = {}
                       setNestedValue(updated[locale], key, text)
                   })
                   
                   console.log('Traductions dynamiques mises à jour :', updated);
                   localStorage.setItem('dynamicTranslations', JSON.stringify(updated))
                   return updated
               })
           },
           getAvailableLocales: () => Object.keys(translations),
           
           exportTranslations: (keys: string[], visibleLanguages: string[]) => {
               console.log('Clés à exporter :', keys);
               console.log('Langues à exporter :', visibleLanguages);

               const i18nStore = get(i18n);
               
               visibleLanguages.forEach(lang => {
                   const staticTrans = i18nStore.getStaticTranslations()[lang] || {};
                   const dynamicTrans = i18nStore.getDynamicTranslations()[lang] || {};
                   
                   console.log(`Traductions statiques pour ${lang} :`, staticTrans);
                   console.log(`Traductions dynamiques pour ${lang} :`, dynamicTrans);

                   const exportData: any = {};

                   keys.forEach(key => {
                       const dynamicValue = getNestedValue(dynamicTrans, key);
                       const staticValue = getNestedValue(staticTrans, key);
                       const inputValue = document.querySelector(`input[data-key="${key}"][data-lang="${lang}"]`)?.value;

                       console.log(`Recherche de la clé ${key} en ${lang}:`, {
                           dynamicValue, 
                           staticValue, 
                           inputValue
                       });

                       const value = inputValue || dynamicValue || staticValue;

                       if (value !== null && value !== undefined) {
                           const parts = key.split('.');
                           let current = exportData;
                           
                           for (let i = 0; i < parts.length - 1; i++) {
                               current[parts[i]] = current[parts[i]] || {};
                               current = current[parts[i]];
                           }
                           
                           current[parts[parts.length - 1]] = value;
                       }
                   });

                   // Reste du code d'export (création de fichier) inchangé
                   const now = new Date();
                   const timestamp = 
                     now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') + '_' +
                     now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0');
                   
                   const jsonString = JSON.stringify(exportData, null, 2);
                   const blob = new Blob([jsonString], { type: 'application/json' });
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.href = url;
                   a.download = `translations_${lang}_${timestamp}.json`;
                   
                   document.body.appendChild(a);
                   a.click();
                   document.body.removeChild(a);
                   URL.revokeObjectURL(url);

                   console.log(`Données exportées pour ${lang} :`, exportData);
               });
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
           getDynamicTranslations: () => get(dynamicTranslations),
           deleteTranslation: (key: string) => {
               dynamicTranslations.update(current => {
                   const updated = { ...current };
                   Object.keys(updated).forEach(locale => {
                       if (updated[locale]) {
                           const keys = key.split('.');
                           let obj = updated[locale];
                           for (let i = 0; i < keys.length - 1; i++) {
                               if (obj[keys[i]] === undefined) return updated;
                               obj = obj[keys[i]];
                           }
                           delete obj[keys[keys.length - 1]];
                       }
                   });
                   localStorage.setItem('dynamicTranslations', JSON.stringify(updated));
                   return updated;
               });
           },
           updateTranslation: (locale: string, key: string, value: string) => {
               dynamicTranslations.update(current => {
                   const updated = { ...current };
                   if (!updated[locale]) updated[locale] = {};
                   setNestedValue(updated[locale], key, value);
                   localStorage.setItem('dynamicTranslations', JSON.stringify(updated));
                   return updated;
               });
           },
           renameTranslationKey: (oldKey: string, newKey: string) => {
               dynamicTranslations.update(current => {
                   const updated = { ...current };
                   Object.keys(updated).forEach(locale => {
                       if (updated[locale]) {
                           const value = getNestedValue(updated[locale], oldKey);
                           if (value !== null) {
                               setNestedValue(updated[locale], newKey, value);
                               // Supprime l'ancienne clé
                               const keys = oldKey.split('.');
                               let obj = updated[locale];
                               for (let i = 0; i < keys.length - 1; i++) {
                                   if (obj[keys[i]] === undefined) break;
                                   obj = obj[keys[i]];
                               }
                               delete obj[keys[keys.length - 1]];
                           }
                       }
                   });
                   localStorage.setItem('dynamicTranslations', JSON.stringify(updated));
                   return updated;
               });
           },
       })
   )

   return i18n
}

export const i18n = createI18nStore()