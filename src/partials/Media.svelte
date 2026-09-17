<script lang="ts">
  import {onDestroy} from "svelte"
  import {displayUrl} from "@welshman/lib"
  import {decryptFile, tagSpec, tagValue} from "@welshman/util"
  import MediaAudio from "src/partials/MediaAudio.svelte"
  import MediaSpotify from "src/partials/MediaSpotify.svelte"
  import MediaTidal from "src/partials/MediaTidal.svelte"
  import MediaVideo from "src/partials/MediaVideo.svelte"
  import MediaImage from "src/partials/MediaImage.svelte"
  import MediaLinkPreview from "src/partials/MediaLinkPreview.svelte"

  export let url: string
  export let fullSize = false
  export let onLinkClick: (url: string, event: any) => void
  export let onImageClick: (url: string, event: any) => void
  export let showLinkPreviews = true

  // The event's imeta for this url, which is where an encrypted attachment keeps its key
  export let tags: string[][] = []

  const isAudio = url.match(/\.(wav|mp3|m3u8)$/)
  const isSpotify = url.match(/open.spotify.com/)
  const isTidal = url.match(/tidal.com/)
  const isVideo = url.match(/\.(mov|webm|mp4)$/)
  const isImage = url.split("?")[0].match(/\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i)

  const key = tagValue(tagSpec("decryption-key"), tags)
  const nonce = tagValue(tagSpec("decryption-nonce"), tags)
  const algorithm = tagValue(tagSpec("encryption-algorithm"), tags)
  const mimeType = tagValue(tagSpec("m"), tags) || tagValue(tagSpec("file-type"), tags)

  const isEncrypted = Boolean(key && nonce && algorithm)

  let objectUrl: string

  // Decrypting produces a blob url, which is what everything below renders. The server only ever
  // had ciphertext, so nothing downstream — the image proxy included — can be handed the real url.
  const loadSrc = async () => {
    if (!isEncrypted) {
      return url
    }

    const res = await fetch(url)
    const ciphertext = new Uint8Array(await res.arrayBuffer())
    const data = await decryptFile({ciphertext, key, nonce, algorithm})

    objectUrl = URL.createObjectURL(new Blob([data], mimeType ? {type: mimeType} : undefined))

    return objectUrl
  }

  const src = loadSrc()

  const linkClickHandler = (event: any) => onLinkClick(url, event)
  const imageClickHandler = (event: any) => onImageClick(url, event)

  onDestroy(() => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }
  })
</script>

<div on:click|stopPropagation class="flex justify-center">
  {#await src}
    <div class="shimmer h-64 w-96" />
  {:then src}
    {#if isAudio}
      <MediaAudio url={src} />
    {:else if isSpotify}
      <MediaSpotify {url} {linkClickHandler} />
    {:else if isTidal}
      <MediaTidal {url} />
    {:else if isVideo}
      <MediaVideo url={src} />
    {:else if isImage}
      <a
        href={src}
        on:click|preventDefault={imageClickHandler}
        class="relative flex h-full flex-grow items-center justify-center">
        <div
          class="flex max-w-[95vw] flex-grow items-center justify-center overflow-hidden rounded">
          <MediaImage url={src} {fullSize} />
        </div>
      </a>
    {:else if isEncrypted}
      <!-- A preview would mean handing this url to a third party, and it would only see ciphertext -->
      <a href={src} download class="underline">Download attachment</a>
    {:else if showLinkPreviews}
      <a href={url} on:click|preventDefault={linkClickHandler}>
        <MediaLinkPreview {url} />
      </a>
    {:else}
      <a
        href={url}
        on:click|preventDefault={linkClickHandler}
        class="overflow-hidden text-ellipsis whitespace-nowrap underline">
        {displayUrl(url)}
      </a>
    {/if}
  {:catch}
    <p class="p-12 text-center text-neutral-300">Unable to decrypt this attachment.</p>
  {/await}
</div>
