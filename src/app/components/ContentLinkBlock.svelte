<script lang="ts">
  import {ellipsize, postJson} from "@welshman/lib"
  import {dufflepud, imgproxy} from "@app/state"
  import {preventDefault, stopPropagation} from "@lib/html"
  import Link from "@lib/components/Link.svelte"
  import ContentLinkDetail from "@app/components/ContentLinkDetail.svelte"
  import ContentLinkBlockImage from "@app/components/ContentLinkBlockImage.svelte"
  import {pushModal} from "@app/modal"

  const {value, event} = $props()

  let hideImage = $state(false)

  const url = value.url.toString()

  const loadPreview = async () => {
    const json = await postJson(dufflepud("link/preview"), {url})

    if (!json?.title && !json?.image) {
      throw new Error("Failed to load link preview")
    }

    return json
  }

  const onError = () => {
    hideImage = true
  }

  const expand = () => pushModal(ContentLinkDetail, {value, event}, {fullscreen: true})
</script>

<Link external href={url} class="my-2 block">
  <div class="overflow-hidden rounded-box leading-[0]">
    {#if url.match(/\.(mov|webm|mp4)$/)}
      <video controls src={url} class="max-h-96 object-contain object-center">
        <track kind="captions" />
      </video>
    {:else if url.match(/\.(jpe?g|png|gif|webp)$/)}
      <button type="button" onclick={stopPropagation(preventDefault(expand))}>
        <ContentLinkBlockImage {value} {event} class="m-auto max-h-96 rounded-box" />
      </button>
    {:else}
      {#await loadPreview()}
        <div class="center my-12 w-full">
          <span class="loading loading-spinner"></span>
        </div>
      {:then preview}
        <div class="bg-alt flex max-w-xl flex-col leading-normal">
          {#if preview.image && !hideImage}
            <img
              alt="Link preview"
              onerror={onError}
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
