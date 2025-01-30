<style>
  .shimmer {
    background: linear-gradient(
      to right,
      rgba(246, 247, 248, 0.4) 8%,
      rgba(209, 211, 219, 0.4) 18%,
      rgba(246, 247, 248, 0.4) 33%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>

<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {imgproxy} from "src/engine"
  import {ensurePlural} from "@welshman/lib"

  export let src
  export let onClick = undefined

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
  on:click={onClick}
  src={imgproxy(urls[i])} />

{#if loading}
  <slot name="placeholder">
    <div
      {...$$props}
      on:click={onClick}
      class={cx($$props.class, "placeholder shimmer h-full min-h-72 bg-neutral-600")}>
    </div>
  </slot>
{/if}
