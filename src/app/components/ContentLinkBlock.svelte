<script lang="ts">
  import {ellipsize, postJson} from "@welshman/lib"
  import {dufflepud, imgproxy} from "@app/state"
  import Link from "@lib/components/Link.svelte"

  export let value

  const url = value.url.toString()

  const loadPreview = async () => {
    const json = await postJson(dufflepud("link/preview"), {url})

    if (!json?.title && !json?.image) {
      throw new Error("Failed to load link preview")
    }

    return json
  }
</script>

<Link
  external
  href={url}
  style="background-color: rgba(15, 15, 14, 0.5)"
  class="relative my-2 flex w-full flex-grow flex-col overflow-hidden rounded-xl">
  {#if url.match(/\.(mov|webm|mp4)$/)}
    <video controls src={url} class="max-h-96 object-contain object-center">
      <track kind="captions" />
    </video>
  {:else if url.match(/\.(jpe?g|png|gif|webp)$/)}
    <img alt="Link preview" src={imgproxy(url)} class="max-h-96 object-cover object-center" />
  {:else}
    {#await loadPreview()}
      <div class="center my-12 w-full">
        <span class="loading loading-spinner" />
      </div>
    {:then preview}
      {#if preview.image}
        <img
          alt="Link preview"
          src={imgproxy(preview.image)}
          class="max-h-96 object-contain object-center" />
      {/if}
      <div class="h-px" />
      {#if preview.title}
        <div class="flex flex-col px-4 py-2">
          <strong class="overflow-hidden text-ellipsis whitespace-nowrap">{preview.title}</strong>
          <small>{ellipsize(preview.description, 140)}</small>
        </div>
      {/if}
    {:catch}
      <p class="mb-1 p-12 text-center">
        Unable to load a preview for {url}
      </p>
    {/await}
  {/if}
</Link>
