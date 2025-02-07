<style>
  .shimmer {
    background: linear-gradient(
      to right,
      var(--tinted-700) 8%,
      var(--tinted-800) 18%,
      var(--tinted-700) 33%
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
  import {imgproxy} from "src/engine"
  import {ensurePlural} from "@welshman/lib"

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

<img {...$$props} class:hidden={loading} on:error={onError} on:load={onLoad} on:click={onClick} src={imgproxy(urls[i])} />

{#if loading}
  <slot name="placeholder">
    <div
      {...$$props}
      on:click={onClick}
      class={cx($$props.class, "placeholder shimmer h-full min-h-72 bg-neutral-600")}>
    </div>
  </slot>
{/if}
