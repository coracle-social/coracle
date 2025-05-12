<script lang="ts">
  import type {ParsedEmojiValue} from "@welshman/content"
  import {imgproxy} from "@app/state"

  export let value: ParsedEmojiValue

  const alt = `:${value.name}:`
</script>

{#if value.url}
  <img
    {alt}
    src={imgproxy(value.url, {w: 24, h: 24})}
    class="-mt-0.5 inline h-[1em] min-w-[1em] align-middle" />
{:else}
  {alt}
{/if}
