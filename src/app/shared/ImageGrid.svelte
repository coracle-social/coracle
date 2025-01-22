<script lang="ts">
  import cx from "classnames"
  import type {Parsed} from "@welshman/content"
  import {imgproxy} from "src/engine"
  import Carousel from "src/app/shared/Carousel.svelte"

  export let images: Parsed[]

  let zoomed: number

  $: columns = Math.ceil(Math.sqrt(images.length))
</script>

<div
  on:click|preventDefault|stopPropagation
  class={cx(
    "grid-cols-" + columns,
    "grid cursor-pointer gap-1 overflow-hidden rounded-lg bg-black",
  )}>
  {#each images as image, i}
    <img
      class="h-full max-h-96 w-full object-cover"
      on:click={() => (zoomed = i)}
      src={imgproxy(image.value?.url?.toString())} />
  {/each}
</div>

{#if zoomed !== undefined}
  <div
    class="z-zoom fixed left-0 top-0 h-full w-full bg-black"
    on:scroll|preventDefault|stopPropagation
    on:click|preventDefault|stopPropagation={() => (zoomed = undefined)}>
    <Carousel
      keyboardShortcut
      items={images}
      currentIndex={zoomed}
      let:item
      onClose={() => (zoomed = undefined)}>
      <img
        class="m-auto h-full max-w-full object-contain"
        on:click|preventDefault|stopPropagation
        src={imgproxy(item.value?.url?.toString())} />
    </Carousel>
  </div>
{/if}
