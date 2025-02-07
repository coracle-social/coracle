<script lang="ts">
  import {fade} from "svelte/transition"
  import Carousel from "src/app/shared/Carousel.svelte"
  import Image from "src/partials/Image.svelte"

  export let urls: string[]
  export let zoomed: number

  const onClose = () => {
    zoomed = undefined
  }
</script>

{#if zoomed !== undefined}
  <div
    class="z-zoom fixed left-0 top-0 h-full w-full overflow-auto bg-black"
    transition:fade={{duration: 200}}
    on:click|preventDefault|stopPropagation={() => (zoomed = undefined)}>
    <Carousel {urls} {onClose} keyboardShortcut currentIndex={zoomed} let:url noScroll>
      <Image
        class="m-auto h-full max-w-full rounded-lg object-contain"
        style="max-width: 80%;"
        src={url}
        onClick={e => e.stopPropagation()} />
    </Carousel>
  </div>
{/if}
