<script lang="ts">
  import {onMount} from "svelte"

  export let urls: any[] = []
  export let onClose: () => void = undefined
  export let currentIndex = 0
  export let noScroll = false

  let carouselElement: HTMLElement
  let container: HTMLElement

  function scrollToIndex(index: number) {
    if (carouselElement) {
      carouselElement.scrollTo({
        left: index * carouselElement.offsetWidth,
        behavior: "smooth",
      })
      currentIndex = index
    }
  }

  function handleScroll(event: WheelEvent | TouchEvent) {
    if (urls.length > 1 && currentIndex !== urls.length - 1) {
      event.stopPropagation()
    }
    if (carouselElement) {
      currentIndex = Math.round(carouselElement.scrollLeft / carouselElement.offsetWidth)
    }
    if (noScroll) event.preventDefault()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      scrollToIndex(Math.max(currentIndex - 1, 0))
    } else if (event.key === "ArrowRight") {
      scrollToIndex(Math.min(currentIndex + 1, urls.length - 1))
    } else if (event.key === "Escape") {
      onClose()
    }
  }

  onMount(() => {
    carouselElement.scrollTo({
      left: currentIndex * carouselElement.offsetWidth,
      behavior: "instant",
    })
  })
</script>

<div
  class="group relative h-full w-full outline-none cursor-pointer"
  on:click={onClose}
  bind:this={container}
  on:keydown|stopPropagation|preventDefault={handleKeydown}
  tabindex="-1"
  autofocus>
  <div
    class="scrollbar-hide flex h-full snap-x snap-mandatory items-center gap-4 overflow-x-scroll scroll-smooth"
    bind:this={carouselElement}
    on:touchmove={handleScroll}
    on:touchend={handleScroll}>
    {#each urls as url, index}
      <div
        class="h-full w-full shrink-0 snap-always overflow-hidden"
        class:snap-start={index === 0}
        class:snap-center={index !== 0}>
        <slot {url} />
      </div>
    {/each}
  </div>

  {#if urls.length > 1}
    <div class="absolute bottom-4 flex w-full items-center justify-center gap-1">
      {#each urls as _, index (index)}
        <button
          class="border-primary h-2 w-2 rounded-full border"
          class:bg-white={index === currentIndex}
          on:click={() => scrollToIndex(index)} />
      {/each}
    </div>
    <div
      class="absolute inset-y-0 left-0 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
      <button
        class="p-8"
        class:opacity-0={currentIndex === 0}
        on:click|stopPropagation={() => scrollToIndex(Math.max(currentIndex - 1, 0))}>
        <i class="fas fa-chevron-left text-2xl"></i>
      </button>
    </div>
    <div
      class="absolute inset-y-0 right-0 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
      <button
        class="p-8"
        class:opacity-0={currentIndex === urls.length - 1}
        on:click|stopPropagation={() => scrollToIndex(Math.min(currentIndex + 1, urls.length - 1))}>
        <i class="fas fa-chevron-right text-2xl"></i>
      </button>
    </div>
  {/if}
</div>
