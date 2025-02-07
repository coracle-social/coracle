<script lang="ts">
  import MediaGrid from "src/app/shared/MediaGrid.svelte"
  import MediaLink from "src/app/shared/MediaLink.svelte"

  export let urls: string[]
  export let showMedia = false

  const onClose = () => {
    hidden = true
  }

  let hidden = false
</script>

{#if showMedia && !hidden}
  <MediaGrid {urls} {onClose} />
{:else}
  {#each urls as url}
    <MediaLink {url} />
  {/each}
{/if}

