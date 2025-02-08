<script lang="ts">
  import {ellipsize, postJson} from "@welshman/lib"
  import Spinner from "src/partials/Spinner.svelte"
  import {dufflepud, imgproxy} from "src/engine"

  export let url: string

  const loadPreview = async () => {
    const json = await postJson(dufflepud("link/preview"), {url})

    if (!json?.title && !json?.image) {
      throw new Error("Failed to load link preview")
    }

    return json
  }
</script>

<a href={url} target="_blank" on:click|stopPropagation>
  {#await loadPreview()}
    <Spinner />
  {:then { title, description, image }}
    {#if image}
      <img
        alt="Link preview"
        src={imgproxy(image)}
        class="m-auto max-h-96 object-contain object-center" />
    {/if}
    {#if image && title}
      <div class="h-px bg-neutral-600" />
    {/if}
    {#if title}
      <div class="flex flex-col bg-white px-4 py-2 text-black">
        <strong class="overflow-hidden text-ellipsis whitespace-nowrap">{title}</strong>
        <small>{ellipsize(description, 140)}</small>
      </div>
    {/if}
  {:catch}
    <p class="mb-1 p-12 text-center text-neutral-300">
      Unable to load a preview for {url}
    </p>
  {/await}
</a>
