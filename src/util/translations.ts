/**
 * i18n Translation System for Coracle
 * 
 * Simple translation system that provides multilingual support.
 * Supports dynamic language switching and interpolation.
 */

import {writable, derived, get, type Readable} from 'svelte/store'

// Type definitions
type TranslationKey = string
type TranslationValue = string
type TranslationParams = Record<string, string | number>
type Translations = Record<TranslationKey, TranslationValue>
type LocaleTranslations = Record<string, Translations>

// Available locales
export const AVAILABLE_LOCALES = ['en', 'fr', 'es', 'de', 'pt', 'it', 'ja', 'zh', 'ru', 'ar'] as const
export type Locale = typeof AVAILABLE_LOCALES[number]

// Default locale
export const DEFAULT_LOCALE: Locale = 'en'

// Translation dictionaries
const translations: LocaleTranslations = {
  en: {
    // General
    'app.name': 'Coracle',
    'app.tagline': 'A Nostr web client',
    
    // Navigation
    'nav.home': 'Home',
    'nav.notifications': 'Notifications',
    'nav.messages': 'Messages',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.search': 'Search',
    'nav.help': 'Help',
    'nav.logout': 'Logout',
    
    // Profile
    'profile.about': 'About You',
    'profile.edit': 'Edit',
    'profile.follow': 'Follow',
    'profile.unfollow': 'Unfollow',
    'profile.message': 'Message',
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.notes': 'Notes',
    'profile.likes': 'Likes',
    'profile.relays': 'Relays',
    'profile.collections': 'Collections',
    'profile.wot_score': 'WoT Score',
    'profile.zen_balance': 'ẐEN Balance',
    'profile.zen_loading': 'Loading balance...',
    'profile.zen_unavailable': 'Balance unavailable',
    'profile.multipass': 'MULTIPASS',
    'profile.zencard': 'ZenCard',
    
    // Actions
    'action.like': 'Like',
    'action.reply': 'Reply',
    'action.repost': 'Repost',
    'action.zap': 'Zap',
    'action.share': 'Share',
    'action.copy': 'Copy',
    'action.report': 'Report',
    'action.delete': 'Delete',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.submit': 'Submit',
    
    // ZEN/Reactions
    'zen.like_cost': 'Liking costs {amount} ẐEN',
    'zen.like_cost_info': 'Each like transfers {amount} ẐEN to the author',
    'zen.balance': '{amount} ẐEN',
    'zen.insufficient_balance': 'Insufficient ẐEN balance',
    'zen.transfer_success': 'Transferred {amount} ẐEN',
    'zen.check_balance': 'Check Balance',
    'zen.wallet_status': 'ẐEN Wallet Status',
    'zen.usage_tokens': 'USAGE TOKENS',
    'zen.property_tokens': 'PROPERTY TOKENS',
    'zen.multipass': 'MULTIPASS',
    'zen.zencard': 'ZEN Card',
    'zen.service_credits': 'Service credits: likes, relay usage, AI',
    'zen.cooperative_shares': 'Cooperative shares (3×⅓ distributed) - Renewal via G1society',
    'zen.can_receive': 'Can receive ẐEN',
    'zen.cannot_receive': 'Cannot receive ẐEN',
    'zen.featured_umap': 'Geo-messages featured in UMAP',
    'zen.no_wallet': 'No ẐEN wallet configured',
    'zen.missing_fields': 'Missing fields',
    'zen.no_multipass': 'No MULTIPASS configured',
    'zen.no_zencard': 'No ZEN Card configured',
    
    // Messages/DMs
    'dm.title': 'Direct Messages',
    'dm.new': 'New Message',
    'dm.encrypted': 'End-to-end encrypted',
    'dm.no_messages': 'No messages yet',
    'dm.send': 'Send',
    'dm.type_message': 'Type a message...',
    'dm.nip17_info': 'NIP-17 improves privacy for direct messages',
    
    // Notifications
    'notification.new': 'New notification',
    'notification.reactions': 'Reactions',
    'notification.mentions': 'Mentions',
    'notification.replies': 'Replies',
    'notification.zaps': 'Zaps',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.theme.dark': 'Dark',
    'settings.theme.light': 'Light',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.wallet': 'Wallet',
    'settings.relays': 'Relays',
    'settings.keys': 'Keys',
    'settings.data': 'Data',
    
    // Errors
    'error.generic': 'Something went wrong',
    'error.network': 'Network error',
    'error.not_found': 'Not found',
    'error.unauthorized': 'Unauthorized',
    
    // Status
    'status.loading': 'Loading...',
    'status.saving': 'Saving...',
    'status.success': 'Success!',
    'status.error': 'Error',
  },
  
  fr: {
    // Général
    'app.name': 'Coracle',
    'app.tagline': 'Un client web Nostr',
    
    // Navigation
    'nav.home': 'Accueil',
    'nav.notifications': 'Notifications',
    'nav.messages': 'Messages',
    'nav.settings': 'Paramètres',
    'nav.profile': 'Profil',
    'nav.search': 'Rechercher',
    'nav.help': 'Aide',
    'nav.logout': 'Déconnexion',
    
    // Profil
    'profile.about': 'À propos de vous',
    'profile.edit': 'Modifier',
    'profile.follow': 'Suivre',
    'profile.unfollow': 'Ne plus suivre',
    'profile.message': 'Message',
    'profile.followers': 'Abonnés',
    'profile.following': 'Abonnements',
    'profile.notes': 'Notes',
    'profile.likes': 'J\'aime',
    'profile.relays': 'Relais',
    'profile.collections': 'Collections',
    'profile.wot_score': 'Score WoT',
    'profile.zen_balance': 'Solde ẐEN',
    'profile.zen_loading': 'Chargement du solde...',
    'profile.zen_unavailable': 'Solde indisponible',
    'profile.multipass': 'MULTIPASS',
    'profile.zencard': 'ZenCard',
    
    // Actions
    'action.like': 'J\'aime',
    'action.reply': 'Répondre',
    'action.repost': 'Republier',
    'action.zap': 'Zapper',
    'action.share': 'Partager',
    'action.copy': 'Copier',
    'action.report': 'Signaler',
    'action.delete': 'Supprimer',
    'action.cancel': 'Annuler',
    'action.save': 'Enregistrer',
    'action.submit': 'Soumettre',
    
    // ZEN/Réactions
    'zen.like_cost': 'Liker coûte {amount} ẐEN',
    'zen.like_cost_info': 'Chaque like transfère {amount} ẐEN à l\'auteur',
    'zen.balance': '{amount} ẐEN',
    'zen.insufficient_balance': 'Solde ẐEN insuffisant',
    'zen.transfer_success': 'Transféré {amount} ẐEN',
    'zen.check_balance': 'Vérifier le solde',
    'zen.wallet_status': 'Statut du portefeuille ẐEN',
    'zen.usage_tokens': 'JETONS D\'USAGE',
    'zen.property_tokens': 'JETONS DE PROPRIÉTÉ',
    'zen.multipass': 'MULTIPASS',
    'zen.zencard': 'Carte ZEN',
    'zen.service_credits': 'Crédits de service: likes, relais, IA',
    'zen.cooperative_shares': 'Parts coopératives (3×⅓ distribués) - Renouvellement via G1society',
    'zen.can_receive': 'Peut recevoir des ẐEN',
    'zen.cannot_receive': 'Ne peut pas recevoir de ẐEN',
    'zen.featured_umap': 'Géo-messages à la une dans UMAP',
    'zen.no_wallet': 'Aucun portefeuille ẐEN configuré',
    'zen.missing_fields': 'Champs manquants',
    'zen.no_multipass': 'Aucun MULTIPASS configuré',
    'zen.no_zencard': 'Aucune ZEN Card configurée',
    
    // Messages/DMs
    'dm.title': 'Messages privés',
    'dm.new': 'Nouveau message',
    'dm.encrypted': 'Chiffrement de bout en bout',
    'dm.no_messages': 'Aucun message pour l\'instant',
    'dm.send': 'Envoyer',
    'dm.type_message': 'Écrivez un message...',
    'dm.nip17_info': 'NIP-17 améliore la confidentialité des messages privés',
    
    // Notifications
    'notification.new': 'Nouvelle notification',
    'notification.reactions': 'Réactions',
    'notification.mentions': 'Mentions',
    'notification.replies': 'Réponses',
    'notification.zaps': 'Zaps',
    
    // Paramètres
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.theme.dark': 'Sombre',
    'settings.theme.light': 'Clair',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Confidentialité',
    'settings.wallet': 'Portefeuille',
    'settings.relays': 'Relais',
    'settings.keys': 'Clés',
    'settings.data': 'Données',
    
    // Erreurs
    'error.generic': 'Une erreur s\'est produite',
    'error.network': 'Erreur réseau',
    'error.not_found': 'Non trouvé',
    'error.unauthorized': 'Non autorisé',
    
    // Statut
    'status.loading': 'Chargement...',
    'status.saving': 'Enregistrement...',
    'status.success': 'Succès !',
    'status.error': 'Erreur',
  },
  
  es: {
    // General
    'app.name': 'Coracle',
    'app.tagline': 'Un cliente web de Nostr',
    
    // Navigation
    'nav.home': 'Inicio',
    'nav.notifications': 'Notificaciones',
    'nav.messages': 'Mensajes',
    'nav.settings': 'Configuración',
    'nav.profile': 'Perfil',
    'nav.search': 'Buscar',
    'nav.help': 'Ayuda',
    'nav.logout': 'Cerrar sesión',
    
    // Profile
    'profile.about': 'Sobre ti',
    'profile.edit': 'Editar',
    'profile.follow': 'Seguir',
    'profile.unfollow': 'Dejar de seguir',
    'profile.message': 'Mensaje',
    'profile.followers': 'Seguidores',
    'profile.following': 'Siguiendo',
    'profile.notes': 'Notas',
    'profile.likes': 'Me gusta',
    'profile.relays': 'Relés',
    'profile.collections': 'Colecciones',
    'profile.wot_score': 'Puntuación WoT',
    'profile.zen_balance': 'Saldo ẐEN',
    'profile.zen_loading': 'Cargando saldo...',
    'profile.zen_unavailable': 'Saldo no disponible',
    'profile.multipass': 'MULTIPASS',
    'profile.zencard': 'ZenCard',
    
    // ZEN/Reactions
    'zen.like_cost': 'Dar me gusta cuesta {amount} ẐEN',
    'zen.like_cost_info': 'Cada me gusta transfiere {amount} ẐEN al autor',
    'zen.balance': '{amount} ẐEN',
    'zen.insufficient_balance': 'Saldo ẐEN insuficiente',
    'zen.transfer_success': 'Transferido {amount} ẐEN',
    'zen.check_balance': 'Verificar saldo',
    
    // Messages
    'dm.title': 'Mensajes directos',
    'dm.new': 'Nuevo mensaje',
    'dm.encrypted': 'Cifrado de extremo a extremo',
    'dm.no_messages': 'Sin mensajes aún',
    'dm.send': 'Enviar',
    'dm.type_message': 'Escribe un mensaje...',
  },
}

// Current locale store
export const currentLocale = writable<Locale>(getBrowserLocale())

// Get browser's preferred locale
function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  
  const browserLang = navigator.language?.split('-')[0] || DEFAULT_LOCALE
  
  if (AVAILABLE_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale
  }
  
  return DEFAULT_LOCALE
}

// Save locale preference to localStorage
currentLocale.subscribe(locale => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('coracle_locale', locale)
  }
})

// Load locale from localStorage on init
export function initLocale(): void {
  if (typeof localStorage !== 'undefined') {
    const savedLocale = localStorage.getItem('coracle_locale') as Locale | null
    if (savedLocale && AVAILABLE_LOCALES.includes(savedLocale)) {
      currentLocale.set(savedLocale)
    }
  }
}

/**
 * Translate a key with optional interpolation
 * @param key - Translation key
 * @param params - Optional parameters for interpolation
 * @param locale - Optional locale override
 */
export function translate(key: TranslationKey, params?: TranslationParams, locale?: Locale): string {
  const currentLang = locale || get(currentLocale)
  const dict = translations[currentLang] || translations[DEFAULT_LOCALE]
  
  let text = dict[key] || translations[DEFAULT_LOCALE][key] || key
  
  // Interpolate parameters
  if (params) {
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value))
    }
  }
  
  return text
}

// Shorthand function
export const t = translate

// Reactive translation store
export const _ = derived(currentLocale, () => {
  return (key: TranslationKey, params?: TranslationParams) => translate(key, params)
})

// Type-safe translation helper for Svelte components
export function createTranslationStore(): Readable<(key: TranslationKey, params?: TranslationParams) => string> {
  return derived(currentLocale, () => translate)
}

// Language display names
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  ja: '日本語',
  zh: '中文',
  ru: 'Русский',
  ar: 'العربية',
}

// Add custom translations (for plugins or white-labeling)
export function addTranslations(locale: Locale, newTranslations: Translations): void {
  if (!translations[locale]) {
    translations[locale] = {}
  }
  Object.assign(translations[locale], newTranslations)
}

// Export for testing
export {translations}

