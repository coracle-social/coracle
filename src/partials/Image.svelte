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
  import {imgproxy} from "src/engine"

  export let src

  let element
  let loading = true

  onMount(() => {
    element.addEventListener("load", () => {
      loading = false
    })
  })
</script>

<img {...$$props} class:hidden={loading} bind:this={element} src={imgproxy(src)} />

{#if loading}
  <slot name="placeholder">
    <div class="placeholder h-48 rounded bg-gray-5" />
  </slot>
{/if}
