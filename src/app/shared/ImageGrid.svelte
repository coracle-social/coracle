<script lang="ts">
  import cx from "classnames"
  import {fade} from "svelte/transition"
  import type {ParsedLinkGridValue} from "@welshman/content"
  import {router} from "src/app/util"
  import Carousel from "src/app/shared/Carousel.svelte"
  import Image from "src/partials/Image.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {displayUrl} from "@welshman/lib"

  export let value: ParsedLinkGridValue
  export let showMedia = false
  export let onClick: (e: any) => void

  let zoomed: number
  let grid: HTMLElement
  $: links = value?.links || []
  $: columns = Math.ceil(Math.sqrt(links.length))

  function getSpan(i: number) {
    // how many slots are left in the row
    const slots = columns - (i % columns)
    return slots
  }
</script>

{#if showMedia}
  <div
    on:click|preventDefault|stopPropagation={onClick}
    bind:this={grid}
    class={cx(
      "grid-cols-" + columns,
      "relative grid cursor-pointer gap-1 overflow-hidden rounded-lg bg-black",
    )}>
    <button
      class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
         rounded-full border border-solid border-neutral-600 bg-white text-black shadow"
      on:click|stopPropagation={() => (grid.style.display = "none")}>
      <i class="fas fa-times"></i>
    </button>
    {#each links as link, i}
      {#if i === 0}
        <Image
          class={cx("col-span-" + getSpan(links.length - 1), "h-full max-h-96 w-full object-cover")}
          onClick={() => (zoomed = i)}
          src={link.toString()} />
      {:else}
        <Image
          class="h-full max-h-96 w-full object-cover"
          onClick={() => (zoomed = i)}
          src={link.toString()} />
      {/if}
    {/each}
  </div>
{:else}
  {#each links as link, i}
    {@const url = link.toString()}
    <Anchor
      modal
      underline
      stopPropagation
      class="block overflow-hidden text-ellipsis whitespace-nowrap underline"
      externalHref={url}
      href={router.at("media").of(url).toString()}>
      {displayUrl(url)}
    </Anchor>
  {/each}
{/if}

{#if zoomed !== undefined}
  <div
    class="z-zoom fixed left-0 top-0 h-full w-full bg-black"
    transition:fade={{duration: 200}}
    on:scroll|preventDefault|stopPropagation
    on:click|preventDefault|stopPropagation={() => (zoomed = undefined)}>
    <Carousel
      keyboardShortcut
      items={links}
      currentIndex={zoomed}
      let:item
      onClose={() => (zoomed = undefined)}>
      <Image
        class="m-auto h-full max-w-full object-contain"
        src={item?.toString()}
        onClick={e => e.stopPropagation()} />
    </Carousel>
  </div>
{/if}
