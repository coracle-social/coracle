<script lang="ts">
  import cx from "classnames"
  import type {ParsedLinkValue} from "@welshman/content"
  import Carousel from "src/app/shared/Carousel.svelte"
  import Image from "src/partials/Image.svelte"

  export let images: ParsedLinkValue[]
  export let onClick: (e: any) => void

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
  on:click|preventDefault|stopPropagation={onClick}
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
    {#if i === 0}
      <Image
        class={cx("col-span-" + getSpan(images.length - 1), "h-full max-h-96 w-full object-cover")}
        onClick={() => (zoomed = i)}
        src={image.url.toString()} />
    {:else}
      <Image
        class="h-full max-h-96 w-full object-cover"
        onClick={() => (zoomed = i)}
        src={image.url.toString()} />
    {/if}
  {/each}
</div>

{#if zoomed !== undefined}
  <div
    class="fixed left-0 top-0 z-zoom h-full w-full bg-black bg-opacity-80"
    on:scroll|preventDefault|stopPropagation
    on:click|preventDefault|stopPropagation={() => (zoomed = undefined)}>
    <Carousel
      keyboardShortcut
      items={images}
      currentIndex={zoomed}
      let:item
      onClose={() => (zoomed = undefined)}>
      <Image
        class="m-auto h-full max-w-full object-contain"
        src={item?.url?.toString()}
        onClick={e => e.stopPropagation()} />
    </Carousel>
  </div>
{/if}
