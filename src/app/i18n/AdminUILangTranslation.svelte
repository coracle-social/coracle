<script lang="ts">
    import { i18n } from '../stores/i18nStore'
    import { onMount } from 'svelte'
    import { isSidebarCollapsed } from '../stores/sidebarStore'
    import type { TranslationReducer } from './types'
    import { supportedLanguages, languageToCountry } from './types'
    import { getFlagEmoji, getAllKeys, getNestedValue } from './utils'
   
    let keys: string[] = []
    let newKey: string = ''
    let visibleLanguages: string[] = [...supportedLanguages]
    let translations: Record<string, any> = {}
    let searchKey: string = ''
    let editingKey: string | null = null
    let newKeyName: string = ''

    // Filtrage et pagination
      // Pagination améliorée
      let currentPage: number = 1
    const itemsPerPage: number = 15

    // Filtrage et pagination
    $: filteredKeys = keys.filter(key => 
        key.toLowerCase().includes(searchKey.toLowerCase())
    )

    $: totalPages = Math.ceil(filteredKeys.length / itemsPerPage)

    $: paginatedKeys = filteredKeys.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    )

    // Réinitialisation de la page courante quand les résultats filtrés changent
    $: if (filteredKeys.length && currentPage > totalPages) {
        currentPage = totalPages
    }

    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page
        }
    }

    function previousPage() {
        currentPage = Math.max(1, currentPage - 1)
    }

    function nextPage() {
        currentPage = Math.min(totalPages, currentPage + 1)
    }

    function exportTranslations() {
        $i18n.exportTranslations()
    }
    
    function saveTranslation(key: string, lang: string, value: string): void {
        console.log('Saving:', key, lang, value)
        const values = { [lang]: value }
        $i18n.addTranslation(key, values)
    }

    function toggleLanguage(lang: string) : void {
        if (visibleLanguages.includes(lang)) {
            visibleLanguages = visibleLanguages.filter(l => l !== lang)
        } else {
            visibleLanguages = [...visibleLanguages, lang].sort()
        }
    }

    function deleteTranslationKey(keyToDelete: string) {
        keys = keys.filter(key => key !== keyToDelete);
    }

    function duplicateTranslationKey(originalKey: string) {
        let newKeyBase = `${originalKey}_copy`;
        let counter = 1;
        let newKeyName = newKeyBase;

        while (keys.includes(newKeyName)) {
            newKeyName = `${newKeyBase}_${counter}`;
            counter++;
        }

        const newTranslations = supportedLanguages.reduce((acc, lang) => {
            acc[lang] = getNestedValue(translations[lang], originalKey);
            return acc;
        }, {});

        $i18n.addTranslation(newKeyName, newTranslations);
        keys = [newKeyName, ...keys];
    }

    function startKeyEdit(oldKey: string) {
        editingKey = oldKey;
        newKeyName = oldKey;
    }

    function saveKeyEdit(oldKey: string) {
        if (newKeyName && newKeyName !== oldKey) {
            const newTranslations = supportedLanguages.reduce((acc, lang) => {
                acc[lang] = getNestedValue(translations[lang], oldKey);
                return acc;
            }, {});

            $i18n.addTranslation(newKeyName, newTranslations);
            keys = keys.map(key => key === oldKey ? newKeyName : key);
            editingKey = null;
        }
    }

    function cancelKeyEdit() {
        editingKey = null;
    }

    async function handleImport(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) {
            try {
                await $i18n.importTranslations(file)
                const staticTrans = $i18n.getStaticTranslations()
                const dynamicTrans = $i18n.getDynamicTranslations()
                
                translations = supportedLanguages.reduce((acc, lang) => {
                    acc[lang] = {
                        ...staticTrans[lang],
                        ...dynamicTrans[lang]
                    }
                    return acc
                }, {} as TranslationReducer)
                
                keys = Array.from(new Set([
                    ...getAllKeys(staticTrans.fr || {}),
                    ...getAllKeys(dynamicTrans.fr || {})
                ])).sort();
                
                (event.target as HTMLInputElement).value = ''
            } catch (error) {
                console.error('Error importing translations:', error)
                alert('Erreur lors de l\'import des traductions')
            }
        }
    }
    function addNewKey() {
        if (newKey && !keys.includes(newKey)) {
            const values = supportedLanguages.reduce((acc, lang) => {
                acc[lang] = ''
                return acc
            }, {})
            $i18n.addTranslation(newKey, values)
            keys = [newKey, ...keys];
            newKey = ''
        }
    }

    function closeManager() {
        window.history.back();
    }

    onMount(() => {
        const trans = $i18n.getStaticTranslations()
        translations = trans
        keys = getAllKeys(trans.fr)
    })
</script>
<button 
    on:click={closeManager}
    class="absolute top-4 right-4 px-3 py-1 bg-red-500 text-black rounded"
>
    Fermer
</button>

<div 
    class="translations-page z-50"
    style="
        position: fixed;
        left: {$isSidebarCollapsed ? '0' : '288px'};
        right: 0;
        top: 0;
        bottom: 0;
        padding: 1rem;
        transition: left 0.3s ease-in-out;
        overflow-x: auto;
        overflow-y: auto;
        background: white;
    ">
    <div class="mb-4 flex gap-4 p-4 bg-gray-100 rounded-lg">
        <button
            on:click={exportTranslations}
            class="px-4 py-2 bg-green-500 text-black rounded border border-black hover:bg-green-600"
        >
            Exporter les traductions
        </button>

        <label class="px-4 py-2 bg-blue-500 text-black rounded hover:bg-blue-600 cursor-pointer">
            Importer les traductions
            <input 
                type="file" 
                accept=".json"
                on:change={handleImport}
                class="hidden"
            />
        </label>
    </div>

    <div class="mb-4 flex gap-4 p-4 bg-gray-100 rounded-lg">
        <span class="font-bold">Langues visibles :</span>
        {#each supportedLanguages as lang}
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={visibleLanguages.includes(lang)}
                    on:change={() => toggleLanguage(lang)}
                />
                <span>{getFlagEmoji(lang)} {lang.toUpperCase()}</span>
            </label>
        {/each}
    </div>

    <div class="mb-4 flex justify-center items-center gap-2">
        <input
            type="text"
            bind:value={searchKey}
            placeholder="Rechercher une clé de traduction..."
            class="w-1/2 p-2 text-center border rounded focus:outline-blue-500"
        />
        <input
            type="text"
            bind:value={newKey}
            placeholder="Nouvelle clé de traduction (exemple : page.home.*)"
            class="w-1/2 p-2 text-center border rounded focus:outline-blue-500"
            on:keydown={(e) => e.key === 'Enter' && addNewKey()}
        />
        <button
            on:click={addNewKey}
            class="px-4 py-2 bg-green-500 text-black rounded border border-black hover:bg-green-600"
        >
            ✓ Ajouter
        </button>
    </div>


    <div class="w-full overflow-x-auto border rounded-lg" style="min-width: 100%;">
        <table class="w-full border-collapse text-sm">
            <thead>
                <tr class="bg-gray-100">
                    <th class="px-2 py-1 header-yellow w-12 sticky left-0 z-20">N°</th>
                    <th class="px-2 py-1 header-yellow sticky left-12 z-20 bg-[#FFC107]" 
                        style="width: {visibleLanguages.length === 0 ? '100%' : '200px'}">
                        Clé
                    </th>
                    {#each visibleLanguages as lang}
                        <th class="px-2 py-1 border header-yellow min-w-[120px] text-left">
                            <span class="flag-and-text whitespace-nowrap">
                                <span class="flag-emoji" title={`Langue : ${lang.toUpperCase()}`}>
                                    {getFlagEmoji(lang)}
                                </span>
                                <span>{lang.toUpperCase()}</span>
                            </span>
                        </th>
                    {/each}
                    <th class="px-2 py-1 border header-yellow text-left sticky right-0 z-20 bg-[#FFC107]">Actions</th>
                </tr>
            </thead>
            
            <tbody>
                {#each paginatedKeys as key, index}
                    <tr class="hover:bg-gray-50">
                        <td class="p-1 border text-center text-xs sticky left-0 z-10 bg-white">
                            {((currentPage - 1) * itemsPerPage) + index + 1}
                        </td>
                        <td class="p-1 border font-mono sticky left-12 bg-white z-10 text-sm"
                        style="width: {visibleLanguages.length === 0 ? '100%' : '200px'}">
                        {#if editingKey === key}
                            <div class="flex items-center gap-1">
                                <input
                                    type="text"
                                    bind:value={newKeyName}
                                    class="w-full p-1 border rounded text-xs"
                                    on:keydown={(e) => {
                                        if (e.key === 'Enter') saveKeyEdit(key);
                                        if (e.key === 'Escape') cancelKeyEdit();
                                    }}
                                />
                                <button 
                                    on:click={() => saveKeyEdit(key)}
                                    class="px-1 py-0.5 bg-green-500 text-white rounded text-xs"
                                >
                                    ✓
                                </button>
                                <button 
                                    on:click={cancelKeyEdit}
                                    class="px-1 py-0.5 bg-red-500 text-white rounded text-xs"
                                >
                                    ✗
                                </button>
                            </div>
                        {:else}
                            <div class="flex items-center justify-between">
                                <span class="truncate" title={key}>{key}</span>
                                <button 
                                    on:click={() => startKeyEdit(key)}
                                    class="ml-1 text-blue-500 hover:text-blue-700 text-xs"
                                >
                                    ✎
                                </button>
                            </div>
                        {/if}
                    </td>
                        {#each visibleLanguages as lang}
                            <td class="p-1 border">
                                <input
                                    type="text"
                                    value={getNestedValue(translations[lang], key)}
                                    on:input={function(event) {
                                        const value = event.currentTarget.value;
                                        saveTranslation(key, lang, value);
                                    }}
                                    class="w-full p-1 border rounded text-sm"
                                />
                            </td>
                        {/each}
                        <td class="p-1 border sticky right-0 z-10 bg-white">
                            <div class="flex gap-1">
                                <button 
                                    on:click={() => duplicateTranslationKey(key)}
                                    class="px-1.5 py-0.5 bg-blue-500 text-white rounded text-xs"
                                    title="Dupliquer la clé"
                                >
                                    📄
                                </button>
                                <button 
                                    on:click={() => deleteTranslationKey(key)}
                                    class="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs"
                                    title="Supprimer la clé"
                                >
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
            <div class="flex justify-center items-center space-x-2 mt-4">
                <button 
                    on:click={previousPage}
                    disabled={currentPage === 1}
                    class="px-4 py-2 bg-blue-500 text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Précédent
                </button>
            
                {#each Array(totalPages) as _, i}
                    <button 
                        on:click={() => goToPage(i + 1)}
                        class="px-4 py-2 {currentPage === i + 1 
                            ? 'bg-blue-700 text-black' 
                            : 'bg-blue-400 text-black hover:bg-blue-500'} rounded"
                    >
                        {i + 1}
                    </button>
                {/each}
            
                <button 
                    on:click={nextPage}
                    disabled={currentPage === totalPages}
                    class="px-4 py-2 bg-blue-500 text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Suivant
                </button>
            </div>
        </table>
    </div>
</div>

<style>
    .translations-page {
        position: absolute;
        right: 0;
        margin: 0;
        padding: 1rem;
        max-width: none !important;
        color: black;
        overflow-x: hidden;
        transition: margin-left 0.3s ease-in-out;
    }

    .translations-page table {
        border-collapse: collapse;
        font-size: 0.875rem;
        min-width: max-content; /* Assure que la table ne se réduit pas trop */
    }

    .translations-page > * {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        color: black;
    }

    .translations-page td, 
    .translations-page th {
        padding: 0.25rem 0.5rem;
    }

    .translations-page input {
        padding: 0.25rem 0.5rem;
    }

    .flag-and-text {
        white-space: nowrap;
    }

    input[type="checkbox"] {
        accent-color: #ffa600;
    }

    .header-yellow {
        background-color: #FFC107;
        color: white;
    }

    input[type="text"] {
        min-height: 28px;
    }

    .translations-page table td {
        max-width: 0;
        overflow: hidden;
    }

    .translations-page input[type="text"]:focus {
        outline: 2px solid #3b82f6;
        outline-offset: -1px;
    }

    .translations-page {
        min-height: 100vh;
        background: white;
        overflow-x: auto;
        transition: all 0.3s ease-in-out;
    }

    /* Ajoutez cette règle pour assurer que la table prend toute la largeur disponible */
    .translations-page > div {
        width: 100%;
        min-width: fit-content;
    }
</style>