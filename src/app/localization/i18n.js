
import { init, getLocaleFromNavigator, addMessages } from 'svelte-i18n';

// Import languages file json
import en from './lang/en.json';
import fr from './lang/fr.json';  // Correction: 'fr' au lieu de 'en'

// Initialisation
init({
    fallbackLocale: 'en',
    initialLocale: getLocaleFromNavigator(),
});

// Add to the svelte dictionary
addMessages('en', en);
addMessages('fr', fr);