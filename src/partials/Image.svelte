<style>
  @keyframes placeholder {
    0% {
      opacity: 0.1;
    }

    100% {
      opacity: 0.2;
    }
  }

  .placeholder {
    animation-name: placeholder;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
</style>

<script lang="ts">
  import {onMount} from "svelte"
  import {ensurePlural} from "hurdak"
  import {imgproxy} from "src/engine"

  export let src

  let element
  let i = 0
  let loading = true
  const urls = ensurePlural(src)

  const onError = () => {
    if (i < urls.length - 1) {
      i++
    }
  }

  onMount(() => {
    element.addEventListener("load", () => {
      loading = false
    })
  })
</script>

<img
  {...$$props}
  class:hidden={loading}
  bind:this={element}
  on:error={onError}
  src={imgproxy(urls[i])} />

{#if loading}
  <slot name="placeholder">
    <div class="placeholder h-48 rounded bg-mid" />
  </slot>
{/if}
