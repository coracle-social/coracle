<script lang="ts">
  import type {ParsedLinkValue} from "@welshman/content"
  import {fade} from "svelte/transition"
  import Carousel from "src/app/shared/Carousel.svelte"
  import Image from "src/partials/Image.svelte"

  export let links: ParsedLinkValue[]
  export let zoomed: number
</script>

{#if zoomed !== undefined}
  <div
    class="z-zoom fixed left-0 top-0 h-full w-full overflow-auto bg-black"
    transition:fade={{duration: 200}}
    on:click|preventDefault|stopPropagation={() => (zoomed = undefined)}>
    <Carousel
      keyboardShortcut
      items={links}
      currentIndex={zoomed}
      let:item
      onClose={() => (zoomed = undefined)}
      noScroll>
      <Image
        class="m-auto h-full max-w-full object-contain"
        src={item?.toString()}
        onClick={e => e.stopPropagation()} />
    </Carousel>
  </div>
{/if}
