<script lang="ts">
  import {currentLocale, AVAILABLE_LOCALES, LOCALE_NAMES, type Locale} from 'src/util/translations'
  import Select from 'src/partials/Select.svelte'
  
  export let compact = false
  
  const options = AVAILABLE_LOCALES.map(code => ({
    value: code,
    label: LOCALE_NAMES[code],
  }))
  
  function handleChange(event: CustomEvent<{value: Locale}>) {
    currentLocale.set(event.detail.value)
  }
</script>

{#if compact}
  <select
    class="bg-neutral-800 text-neutral-100 rounded px-2 py-1 text-sm border border-neutral-600 focus:border-accent focus:outline-none"
    value={$currentLocale}
    on:change={(e) => currentLocale.set(e.currentTarget.value)}>
    {#each options as {value, label}}
      <option {value}>{label}</option>
    {/each}
  </select>
{:else}
  <div class="language-selector">
    <label class="block text-sm text-neutral-400 mb-2">
      <i class="fa fa-globe mr-2"></i>
      Language
    </label>
    <select
      class="w-full bg-neutral-800 text-neutral-100 rounded px-3 py-2 border border-neutral-600 focus:border-accent focus:outline-none"
      value={$currentLocale}
      on:change={(e) => currentLocale.set(e.currentTarget.value)}>
      {#each options as {value, label}}
        <option {value}>{label}</option>
      {/each}
    </select>
  </div>
{/if}

<style>
  select {
    cursor: pointer;
    appearance: auto;
  }
  
  select:hover {
    border-color: var(--accent, #10b981);
  }
</style>

