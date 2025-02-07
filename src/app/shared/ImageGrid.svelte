<script lang="ts">
  import type {ParsedLinkValue} from "@welshman/content"
  import {displayUrl} from "@welshman/lib"
  import cx from "classnames"
  import {router} from "src/app/util"
  import Anchor from "src/partials/Anchor.svelte"
  import Image from "src/partials/Image.svelte"
  import ImageZoom from "./ImageZoom.svelte"

  export let links: ParsedLinkValue[]
  export let showMedia = false
  export let onClick: (e: any) => void

  const columns = Math.ceil(Math.sqrt(links.length))

  const getSpan = (i: number) => columns - (i % columns)

  let zoomed: number
  let grid: HTMLElement
</script>

{#if showMedia}
  <div
    on:click|preventDefault|stopPropagation={onClick}
    bind:this={grid}
    class={cx(
      "grid-cols-" + columns,
      "relative my-2 grid cursor-pointer gap-1 overflow-hidden rounded-lg bg-black",
    )}>
    <button
      class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
         rounded-full border border-solid border-neutral-600 bg-white text-black shadow"
      on:click|stopPropagation={() => (grid.style.display = "none")}>
      <i class="fas fa-times"></i>
    </button>
    {#each links as link, i}
      {@const zoom = () => (zoomed = i)}
      {#if i === 0}
        <Image
          onClick={zoom}
          class={cx("col-span-" + getSpan(links.length - 1), "h-full max-h-96 w-full object-cover")}
          src={link.url.toString()} />
      {:else}
        <Image
          onClick={zoom}
          class="h-full max-h-96 w-full object-cover"
          src={link.url.toString()} />
      {/if}
    {/each}
  </div>
{:else}
  {#each links as link, i}
    {@const url = link.url.toString()}
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

<ImageZoom {links} bind:zoomed />
