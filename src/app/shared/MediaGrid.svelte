<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Media from "src/partials/Media.svelte"

  export let urls: string[]
  export let onClose: (e: any) => void

  const columns = Math.ceil(Math.sqrt(urls.length))

  const getSpan = (i: number) => columns - (i % columns)
</script>

<div class="grid-cols-{columns} relative my-2 grid cursor-pointer gap-1 overflow-hidden rounded">
  {#each urls as url, i}
    {@const className = i === 0 ? "col-span-" + getSpan(urls.length - 1) : ""}
    <Anchor externalHref={url} class="h-full max-h-96 w-full object-cover {className}">
      <Media {url} />
    </Anchor>
  {/each}
  {#if onClose}
    <div
      on:click|preventDefault|stopPropagation={onClose}
      class="absolute right-0 top-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
       rounded-full bg-white text-black opacity-50 shadow">
      <i class="fa fa-times" />
    </div>
  {/if}
</div>
