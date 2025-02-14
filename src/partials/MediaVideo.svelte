<script lang="ts">
  export let url

  const onLoad = () => {
    loaded = true
  }

  let loaded = false
</script>

<video
  controls
  src={url}
  on:loadeddata={onLoad}
  on:click|stopPropagation
  class:hidden={!loaded}
  class="max-h-96 object-contain object-center" />

{#if !loaded}
  <div class="shimmer h-64 w-96" />
{/if}
