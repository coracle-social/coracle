<script lang="ts">
  import {ensurePlural} from "@welshman/lib"
  import Spinner from "src/partials/Spinner.svelte"
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
  <Spinner />
{/if}
