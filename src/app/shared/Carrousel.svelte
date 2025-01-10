<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* For IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>

<script lang="ts">
  export let items: any[] = []

  let carouselElement: HTMLElement
  let container: HTMLElement
  let currentIndex = 0

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
    if (items.length > 1 && currentIndex != items.length - 1) {
      event.stopPropagation()
    }
    if (carouselElement) {
      currentIndex = Math.round(carouselElement.scrollLeft / carouselElement.offsetWidth)
    }
  }
</script>

<div class="group relative w-full" bind:this={container}>
  <div
    class="bg-base-200 scrollbar-hide flex snap-x snap-mandatory items-center gap-4 overflow-x-scroll scroll-smooth rounded-xl"
    bind:this={carouselElement}
    on:wheel={handleScroll}
    on:touchmove={handleScroll}
    on:touchend={handleScroll}>
    {#each items as item, index}
      <div
        class="w-full shrink-0 snap-always overflow-hidden rounded-xl bg-opacity-50"
        class:snap-start={index == 0}
        class:snap-center={index != 0}>
        <slot {item}>Missing template</slot>
      </div>
    {/each}
  </div>

  {#if items.length > 1}
    <div class="absolute bottom-4 flex w-full items-center justify-center gap-1">
      {#each items as _, index (index)}
        <button
          class="border-primary h-2 w-2 rounded-full border"
          class:bg-white={index === currentIndex}
          on:click={() => scrollToIndex(index)} />
      {/each}
    </div>
    {#if currentIndex > 0}
      <div
        class="absolute inset-y-0 left-0 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
        <button
          class="bg-primary rounded-full p-2 text-white"
          on:click|stopPropagation={() => scrollToIndex(Math.max(currentIndex - 1, 0))}>
          <i class="fas fa-chevron-left text-2xl"></i>
        </button>
      </div>
    {/if}
    {#if currentIndex < items.length - 1}
      <div
        class="absolute inset-y-0 right-0 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
        <button
          class="bg-primary rounded-full p-2 text-white"
          on:click|stopPropagation={() =>
            scrollToIndex(Math.min(currentIndex + 1, items.length - 1))}>
          <i class="fas fa-chevron-right text-2xl"></i>
        </button>
      </div>
    {/if}
  {/if}
  <button
    class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
           rounded-full border border-solid border-neutral-600 bg-white text-black opacity-0 shadow transition-opacity group-hover:opacity-50"
    on:click|stopPropagation={() => (container.style.display = "none")}>
    <i class="fas fa-times"></i>
  </button>
</div>
