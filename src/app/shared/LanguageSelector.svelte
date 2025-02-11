<script>
    import { locale } from 'svelte-i18n'
    import { fade, fly } from 'svelte/transition'
    import { quintOut } from 'svelte/easing'
    
    const languages = [
        { 
            code: 'fr', 
            name: 'Français',
            fullName: 'Français (French)',
            flag: `<svg class="w-5 h-5" viewBox="0 0 640 480">
                    <g fill-rule="evenodd" stroke-width="1pt">
                        <path fill="#fff" d="M0 0h640v480H0z"/>
                        <path fill="#00267f" d="M0 0h213.3v480H0z"/>
                        <path fill="#f31830" d="M426.7 0H640v480H426.7z"/>
                    </g>
                   </svg>`
        },
        { 
            code: 'en', 
            name: 'English',
            fullName: 'English (UK)',
            flag: `<svg class="w-5 h-5" viewBox="0 0 640 480">
                    <path fill="#012169" d="M0 0h640v480H0z"/>
                    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
                    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
                   </svg>`
        },
        { 
            code: 'es', 
            name: 'Español',
            fullName: 'Español (Spanish)',
            flag: `<svg class="w-5 h-5" viewBox="0 0 640 480">
                    <path fill="#c60b1e" d="M0 0h640v480H0z"/>
                    <path fill="#ffc400" d="M0 120h640v240H0z"/>
                   </svg>`
        },
        {
            code: 'de',
            name: 'Deutsch',
            fullName: 'Deutsch (German)',
            flag: `<svg class="w-5 h-5" viewBox="0 0 640 480">
                    <path fill="#ffce00" d="M0 320h640v160H0z"/>
                    <path d="M0 0h640v160H0z"/>
                    <path fill="#d00" d="M0 160h640v160H0z"/>
                   </svg>`
        }
    ]

    let isOpen = false
    let dropdownPosition = 'bottom'
    let dropdownHeight = 0
    let tooltipVisible = false
    let tooltipContent = ''
    let tooltipPosition = { x: 0, y: 0 }

    function toggleDropdown(event) {
        const button = event.target.closest('.language-selector')
        if (!button) return
        
        const buttonRect = button.getBoundingClientRect()
        const windowHeight = window.innerHeight
        
        // Hauteur estimée du menu (nombre de langues * hauteur par option + padding)
        const estimatedHeight = (languages.length * 40) + 16
        
        // Calcul de l'espace disponible
        const spaceBelow = windowHeight - buttonRect.bottom
        const spaceAbove = buttonRect.top
        
        dropdownPosition = (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) ? 'top' : 'bottom'
        dropdownHeight = Math.min(estimatedHeight, dropdownPosition === 'top' ? spaceAbove - 10 : spaceBelow - 10)
        
        isOpen = !isOpen
    }

    function changeLanguage(langCode) {
        $locale = langCode
        isOpen = false
    }

    function showTooltip(event, lang) {
        const rect = event.target.getBoundingClientRect()
        tooltipContent = lang.fullName
        tooltipPosition = {
            x: rect.right + 10,
            y: rect.top + (rect.height / 2)
        }
        tooltipVisible = true
    }

    function hideTooltip() {
        tooltipVisible = false
    }

    function handleClickOutside(event) {
        if (isOpen && !event.target.closest('.language-selector')) {
            isOpen = false
        }
    }

    function handleResize() {
        if (isOpen) {
            toggleDropdown({ target: document.querySelector('.language-selector') })
        }
    }

    $: dropdownStyle = dropdownPosition === 'top' 
        ? `bottom: 100%; margin-bottom: 0.5rem; max-height: ${dropdownHeight}px` 
        : `top: 100%; margin-top: 0.5rem; max-height: ${dropdownHeight}px`
</script>

<svelte:window 
    on:click={handleClickOutside}
    on:resize={handleResize}
/>

<!-- Fixed container for stacking context -->
<div class="fixed top-0 left-0 w-full h-0 pointer-events-none" style="z-index: 9999;"></div>

<div class="relative language-selector" style="z-index: 50;">
    <!-- Sélecteur -->
    <button 
        type="button"
        on:click={toggleDropdown}
        class="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    >
        <span class="flex items-center">
            {@html languages.find(lang => lang.code === $locale)?.flag}
        </span>
        <span class="font-medium">
            {languages.find(lang => lang.code === $locale)?.name}
        </span>
        <svg
            class="w-4 h-4 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    </button>

    <!-- Menu déroulant -->
    {#if isOpen}
        <div
            transition:fly|local={{y: dropdownPosition === 'top' ? 10 : -10, duration: 200, easing: quintOut}}
            class="absolute left-0 w-48 bg-white shadow-lg rounded-lg border border-gray-200 overflow-y-auto"
            style="{dropdownStyle}; z-index: 51;"
        >
            {#each languages as lang}
                <button
                    type="button"
                    on:click={() => changeLanguage(lang.code)}
                    on:mouseenter={(e) => showTooltip(e, lang)}
                    on:mouseleave={hideTooltip}
                    class="w-full px-4 py-2 flex items-center space-x-3 hover:bg-blue-50 transition-colors duration-150
                        {$locale === lang.code ? 'bg-blue-50' : ''}"
                >
                    <span>{@html lang.flag}</span>
                    <span class="font-medium {$locale === lang.code ? 'text-blue-600' : 'text-gray-700'}">
                        {lang.name}
                    </span>
                    {#if $locale === lang.code}
                        <svg class="w-4 h-4 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}

    <!-- Tooltip -->
    {#if tooltipVisible}
        <div
            transition:fade|local={{duration: 100}}
            class="fixed bg-gray-900 text-white px-3 py-1 rounded-md text-sm"
            style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px; transform: translateY(-50%); z-index: 52;"
        >
            {tooltipContent}
        </div>
    {/if}
</div>

<style>
    /* Prevent text selection */
    .language-selector {
        user-select: none;
        isolation: isolate;
    }

    /* Rotation animation */
    .rotate-180 {
        transform: rotate(180deg);
    }

    /* Custom scrollbar styles */
    .language-selector :global(::-webkit-scrollbar) {
        width: 6px;
    }

    .language-selector :global(::-webkit-scrollbar-track) {
        background: #f1f1f1;
        border-radius: 3px;
    }

    .language-selector :global(::-webkit-scrollbar-thumb) {
        background: #888;
        border-radius: 3px;
    }

    .language-selector :global(::-webkit-scrollbar-thumb:hover) {
        background: #555;
    }
</style>