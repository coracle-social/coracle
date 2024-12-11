<script lang="ts">
  import {slide, fade} from "svelte/transition"

  export let loading = false
</script>

<span class="flex min-h-10 items-center">
  {#if loading}
    <span class="pr-3" transition:slide|local={{axis: "x"}}>
      <span class="loading loading-spinner" transition:fade|local={{duration: 100}} />
    </span>
  {/if}
  <slot />
</span>
