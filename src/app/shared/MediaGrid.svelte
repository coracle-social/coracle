<script lang="ts">
  import {displayUrl} from "@welshman/lib"
  import cx from "classnames"
  import {router} from "src/app/util"
  import Anchor from "src/partials/Anchor.svelte"
  import Image from "src/partials/Image.svelte"
  import ImageZoom from "./ImageZoom.svelte"

  export let urls: string[]
  export let onClose: (e: any) => void

  const columns = Math.ceil(Math.sqrt(urls.length))

  const getSpan = (i: number) => columns - (i % columns)

  let zoomed: number
  let grid: HTMLElement
</script>

<div
  on:click|preventDefault|stopPropagation
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
  {#each urls as url, i}
    {@const zoom = () => (zoomed = i)}
    {#if i === 0}
      <Image
        src={url}
        onClick={zoom}
        class={cx("col-span-" + getSpan(urls.length - 1), "h-full max-h-96 w-full object-cover")} />
    {:else}
      <Image src={url} onClick={zoom} class="h-full max-h-96 w-full object-cover" />
    {/if}
  {/each}
  {#if onClose}
    <div
      on:click|preventDefault={onClose}
      class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
       rounded-full border border-solid border-neutral-600 bg-white text-black opacity-50 shadow">
      <i class="fa fa-times" />
    </div>
  {/if}
</div>

<ImageZoom {urls} bind:zoomed />
