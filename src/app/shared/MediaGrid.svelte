<script lang="ts">
  import Media from "src/partials/Media.svelte"
  import AltColor from "src/partials/AltColor.svelte"

  export let urls: string[]
  export let onClose: (e: any) => void
  export let onLinkClick: (url: string, event: PointerEvent) => void
  export let onImageClick: (url: string, event: PointerEvent) => void

  const useGrid = urls.length > 2
  const className = useGrid ? "p-2" : ""
  const columns = useGrid ? Math.ceil(Math.sqrt(urls.length)) : 1
  const getSpan = (i: number) => columns - (i % columns)
</script>

<AltColor
  background={useGrid}
  class="grid-cols-{columns} relative my-2 grid cursor-pointer gap-2 overflow-hidden rounded {className}">
  {#each urls as url, i}
    {@const className = i === 0 ? "col-span-" + getSpan(urls.length - 1) : ""}
    <AltColor background={!useGrid} class="h-full w-full object-cover {className}">
      <Media {url} {onLinkClick} {onImageClick} />
    </AltColor>
  {/each}
  {#if onClose}
    <div
      on:click|preventDefault|stopPropagation={onClose}
      class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
       rounded-full bg-white text-black opacity-50 shadow">
      <i class="fa fa-times" />
    </div>
  {/if}
</AltColor>
