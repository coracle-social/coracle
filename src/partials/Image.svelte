<script lang="ts">
  import {ensurePlural} from "@welshman/lib"
  import {imgproxy} from "src/engine"

  export let src
  export let onClick = undefined

  const urls = ensurePlural(src)

  let i = 0
  let loading = true

  const onLoad = () => {
    loading = false
  }

  const onError = () => {
    if (i < urls.length - 1) {
      i++
    }
  }
</script>

<img
  {...$$props}
  class:hidden={loading}
  on:error={onError}
  on:load={onLoad}
  on:click={onClick}
  src={imgproxy(urls[i])} />

{#if loading}
  <div class="shimmer h-64 w-96" />
{/if}
