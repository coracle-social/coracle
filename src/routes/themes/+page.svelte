<script lang="ts">
  import themes from "daisyui/src/theming/themes"
  import {identity} from "@welshman/lib"
  import {createSearch} from "@lib/util"
  import Icon from "@lib/components/Icon.svelte"
  import {theme} from "@app/theme"

  let term = ""

  const searchThemes = createSearch(Object.keys(themes), {getValue: identity})
</script>

<div class="content column gap-4">
  <h1 class="superheading mt-20">Discover Themes</h1>
  <p class="text-center">Make your community feel like home</p>
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for themes..." />
  </label>
  <div class="grid grid-cols-2 gap-4 md:grid-cols-2">
    {#each searchThemes.searchValues(term) as name}
      <div class="card bg-base-100 shadow-xl" data-theme={name}>
        <div class="card-body">
          <h2 class="card2 card-title justify-center capitalize">{name}</h2>
          <div class="card-actions">
            <button class="btn btn-primary w-full" on:click={() => theme.set(name)}
              >Use Theme</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
