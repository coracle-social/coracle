<script lang="ts">
  import cx from "classnames"
  import type {ParsedLink} from "@welshman/content"
  import {imgproxy} from "src/engine"
  import Carousel from "src/app/shared/Carousel.svelte"

  export let images: ParsedLink[]

  let zoomed: number
  let grid: HTMLElement

  $: columns = Math.ceil(Math.sqrt(images.length))

  function getSpan(i: number) {
    // how many slots are left in the row
    const slots = columns - (i % columns)
    return slots
  }
</script>

<div
  on:click|preventDefault|stopPropagation
  bind:this={grid}
  class={cx(
    "grid-cols-" + columns,
    "relative grid cursor-pointer gap-1 overflow-hidden rounded-lg bg-black",
  )}>
  <button
    class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
         rounded-full border border-solid border-neutral-600 bg-white text-black opacity-50 shadow"
    on:click|stopPropagation={() => (grid.style.display = "none")}>
    <i class="fas fa-times"></i>
  </button>
  {#each images as image, i}
    {#if i === images.length - 1}
      <img
        class={cx("col-span-" + getSpan(i), "h-full max-h-96 w-full object-cover")}
        on:click={() => (zoomed = i)}
        src={imgproxy(image.value?.url?.toString())} />
    {:else}
      <img
        class="h-full max-h-96 w-full object-cover"
        on:click={() => (zoomed = i)}
        src={imgproxy(image.value?.url?.toString())} />
    {/if}
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
