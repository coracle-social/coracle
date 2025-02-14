<script lang="ts">
    import { i18n } from '../stores/i18nStore'
    import { onMount } from 'svelte'
    
    interface TranslationReducer {
        [key: string]: {
            [key: string]: string | object
        }
    }

    const languages: string[] = ['fr', 'en', 'es', 'de']
    let keys: string[] = []
    let newKey: string = ''
    let visibleLanguages: string[] = [...languages]
    let translations: Record<string, any> = {}
    let searchKey: string = ''
    let editingKey: string | null = null
    let newKeyName: string = ''

    // Pagination
    let currentPage: number = 1
    const itemsPerPage: number = 10

    // Filtrage et pagination
    $: filteredKeys = keys.filter(key => 
        key.toLowerCase().includes(searchKey.toLowerCase())
    )

    $: totalPages = Math.ceil(filteredKeys.length / itemsPerPage)

    $: paginatedKeys = filteredKeys.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    )

    // Réinitialisez la pagination quand les filtres changent
    $: if (filteredKeys.length) {
        currentPage = 1
    }

    // Fonctions de pagination
    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page
        }
    }

    function previousPage() {
        if (currentPage > 1) {
            currentPage--
        }
    }

    function nextPage() {
        if (currentPage < totalPages) {
            currentPage++
        }
    }

    // Fonctions existantes
    function exportTranslations() {
        $i18n.exportTranslations()
    }

    function getAllKeys(obj: any, prefix: string = ''): string[] {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const newKey = prefix ? `${prefix}.${key}` : key
            if (typeof value === 'object') {
                return [...acc, ...getAllKeys(value, newKey)]
            }
            return [...acc, newKey]
        }, [])
    }

    function getNestedValue(obj: any, path: string): string {
        return path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : '', obj)
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

    // Fonctions CRUD
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

        const newTranslations = languages.reduce((acc, lang) => {
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
            const newTranslations = languages.reduce((acc, lang) => {
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

    // Import des traductions
    async function handleImport(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) {
            try {
                await $i18n.importTranslations(file)
                const staticTrans = $i18n.getStaticTranslations()
                const dynamicTrans = $i18n.getDynamicTranslations()
                
                translations = languages.reduce((acc, lang) => {
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

    onMount(() => {
        const trans = $i18n.getStaticTranslations()
        translations = trans
        keys = getAllKeys(trans.fr)
    })

    function addNewKey() {
        if (newKey && !keys.includes(newKey)) {
            const values = languages.reduce((acc, lang) => {
                acc[lang] = ''
                return acc
            }, {})
            $i18n.addTranslation(newKey, values)
            keys = [newKey, ...keys];
            newKey = ''
        }
    }

    function closeManager() {
        window.history.back(); // ou router.pop() selon votre implémentation
    }
</script>

<button 
    on:click={closeManager}
    class="absolute top-4 right-4 px-3 py-1 bg-red-500 text-black rounded"
>
    Fermer
</button>

<div class="translations-page w-screen min-h-screen bg-white">
    <!-- Section Import/Export -->
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
                class="hipx-4 py-2 bg-green-500 text-black rounded border border-black hover:bg-green-600"
            />
        </label>
    </div>

    <br />

    <!-- Section Langues visibles -->
    <div class="mb-4 flex gap-4 p-4 bg-gray-100 rounded-lg">
        <span class="font-bold">Langues visibles :</span>
        {#each languages as lang}
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={visibleLanguages.includes(lang)}
                    on:change={() => toggleLanguage(lang)}
                />
                <span>{lang.toUpperCase()}</span>
            </label>
        {/each}
    </div>

    <!-- Barre de recherche et ajout de nouvelle clé -->
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

    <br />
    
    <!-- Tableau des traductions -->
            <div class="w-full overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="px-4 py-2 header-yellow">N° / #</th>
                            <th class="px-4 py-2 header-yellow" 
                                style="width: {visibleLanguages.length === 0 ? '100%' : '250px'}">
                                Clé
                            </th>
                            {#each visibleLanguages as lang}
                                <th class="px-4 py-2 border header-yellow min-w-[150px] text-left">
                                    {lang.toUpperCase()}
                                </th>
                            {/each}
                            <th class="px-4 py-2 border header-yellow text-left">Actions</th>
                        </tr>
                    </thead>
            
            <tbody>
                {#each paginatedKeys as key, index}
                    <tr class="hover:bg-gray-50">
                        <td class="p-4 border text-center">
                            {((currentPage - 1) * itemsPerPage) + index + 1}
                        </td>
                        <td class="p-4 border font-mono sticky left-0 bg-white z-10"
                            style="width: {visibleLanguages.length === 0 ? '100%' : '250px'}">
                            {#if editingKey === key}
                                <div class="flex items-center">
                                    <input
                                        type="text"
                                        bind:value={newKeyName}
                                        class="w-full p-2 border rounded mr-2"
                                        on:keydown={(e) => {
                                            if (e.key === 'Enter') saveKeyEdit(key);
                                            if (e.key === 'Escape') cancelKeyEdit();
                                        }}
                                    />
                                    <button 
                                        on:click={() => saveKeyEdit(key)}
                                        class="px-2 py-1 bg-green-500 text-white rounded mr-1"
                                    >
                                        ✓
                                    </button>
                                    <button 
                                        on:click={cancelKeyEdit}
                                        class="px-2 py-1 bg-red-500 text-white rounded"
                                    >
                                        ✗
                                    </button>
                                </div>
                            {:else}
                                <div class="flex items-center">
                                    <span>{key}</span>
                                    <button 
                                        on:click={() => startKeyEdit(key)}
                                        class="ml-2 text-blue-500 hover:text-blue-700"
                                    >
                                        ✎
                                    </button>
                                </div>
                            {/if}
                        </td>
                        {#each visibleLanguages as lang}
                            <td class="p-4 border">
                                <input
                                    type="text"
                                    value={getNestedValue(translations[lang], key)}
                                    on:input={function(event) {
                                        const value = event.currentTarget.value;
                                        saveTranslation(key, lang, value);
                                    }}
                                    class="w-full p-2 border rounded"
                                />
                            </td>
                        {/each}
                        <td class="p-4 border">
                            <div class="flex gap-2">
                                <button 
                                    on:click={() => duplicateTranslationKey(key)}
                                    class="px-2 py-1 bg-blue-500 text-white rounded"
                                    title="Dupliquer la clé"
                                >
                                    📄
                                </button>
                                <button 
                                    on:click={() => deleteTranslationKey(key)}
                                    class="px-2 py-1 bg-red-500 text-white rounded"
                                    title="Supprimer la clé"
                                >
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex justify-center items-center mt-4 space-x-2">
            <button 
                on:click={previousPage} 
                disabled={currentPage === 1}
                class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
                Précédent
            </button>
        
            <div class="flex space-x-1">
                {#each Array(totalPages) as _, i}
                    <button 
                        on:click={() => goToPage(i + 1)}
                        class="px-3 py-1 {currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-blue-200'} rounded"
                    >
                        {i + 1}
                    </button>
                {/each}
            </div>
        
            <button 
                on:click={nextPage} 
                disabled={currentPage === totalPages}
                class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
                Suivant
            </button>
        </div>
    </div>
</div>

<style>
    :global(.translations-page) {
        position: absolute;
        left: 0;
        right: 0;
        margin: 0;
        padding: 0;
        max-width: none !important;
        color: black;
    }

    :global(.translations-page > *) {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        color: black;
    }

    input[type="checkbox"] {
        accent-color: #ffa600;
    }
    .header-yellow {
        background-color: #FFC107;
        color: white;
    }

</style>