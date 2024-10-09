<script lang="ts">
  import themes from "daisyui/src/theming/themes"
  import {identity} from "@welshman/lib"
  import {createSearch} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import PageHeader from "@lib/components/PageHeader.svelte"
  import {theme} from "@app/theme"

  let term = ""

  const searchThemes = createSearch(Object.keys(themes), {getValue: identity})
</script>

<div class="content column gap-4">
  <PageHeader>
    <div slot="title">Discover Themes</div>
    <div slot="info">Make your community feel like home</div>
  </PageHeader>
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for themes..." />
  </label>
  <div class="grid grid-cols-2 gap-4 md:grid-cols-2">
    {#each searchThemes.searchValues(term) as name}
      <div class="card2 bg-alt flex flex-col justify-center gap-4 shadow-xl" data-theme={name}>
        <h2 class="card2 bg-alt text-center capitalize">{name}</h2>
        <button class="btn btn-primary w-full" on:click={() => theme.set(name)}>Use Theme</button>
      </div>
    {/each}
  </div>
</div>
