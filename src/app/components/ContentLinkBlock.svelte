<script lang="ts">
  import {ellipsize, postJson} from "@welshman/lib"
  import {dufflepud, imgproxy} from "@app/state"
  import Link from "@lib/components/Link.svelte"
  import ContentLinkDetail from "@app/components/ContentLinkDetail.svelte"
  import {pushModal} from "@app/modal"

  export let value

  const url = value.url.toString()

  const loadPreview = async () => {
    const json = await postJson(dufflepud("link/preview"), {url})

    if (!json?.title && !json?.image) {
      throw new Error("Failed to load link preview")
    }

    return json
  }

  const expand = () => pushModal(ContentLinkDetail, {url}, {fullscreen: true})
</script>

<Link external href={url} class="my-2 block">
  <div class="overflow-hidden rounded-box leading-[0]">
    {#if url.match(/\.(mov|webm|mp4)$/)}
      <video controls src={url} class="max-h-96 object-contain object-center">
        <track kind="captions" />
      </video>
    {:else if url.match(/\.(jpe?g|png|gif|webp)$/)}
      <button type="button" on:click|stopPropagation|preventDefault={expand}>
        <img alt="Link preview" src={imgproxy(url)} class="m-auto max-h-96" />
      </button>
    {:else}
      {#await loadPreview()}
        <div class="center my-12 w-full">
          <span class="loading loading-spinner" />
        </div>
      {:then preview}
        <div class="bg-alt flex max-w-xl flex-col leading-normal">
          {#if preview.image}
            <img
              alt="Link preview"
              src={imgproxy(preview.image)}
              class="bg-alt max-h-72 object-contain object-center" />
          {/if}
          {#if preview.title}
            <div class="flex flex-col gap-2 p-4">
              <strong class="overflow-hidden text-ellipsis whitespace-nowrap"
                >{preview.title}</strong>
              <p>{ellipsize(preview.description, 140)}</p>
            </div>
          {/if}
        </div>
      {:catch}
        <p class="bg-alt p-12 text-center leading-normal">
          Unable to load a preview for {url}
        </p>
      {/await}
    {/if}
  </div>
</Link>
