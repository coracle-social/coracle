<script lang="ts">
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

  const isAudio = url.match(/\.(wav|mp3|m3u8)$/)
  const isSpotify = url.match(/open.spotify.com/)
  const isTidal = url.match(/tidal.com/)
  const isVideo = url.match(/\.(mov|webm|mp4)$/)
  const isImage = url.match(/\.(jpe?g|png|gif|webp)$/)

  const linkClickHandler = (event: any) => onLinkClick(url, event)
  const imageClickHandler = (event: any) => onImageClick(url, event)
</script>

<div on:click|stopPropagation class="flex justify-center">
  {#if isAudio}
    <MediaAudio {url} />
  {:else if isSpotify}
    <MediaSpotify {url} />
  {:else if isTidal}
    <MediaTidal {url} />
  {:else if isVideo}
    <MediaVideo {url} />
  {:else if isImage}
    <a
      href={url}
      on:click|preventDefault={imageClickHandler}
      class="relative flex h-full flex-grow items-center justify-center">
      <div class="flex max-w-[95vw] flex-grow items-center justify-center overflow-hidden rounded">
        <MediaImage {url} {fullSize} />
      </div>
    </a>
  {:else}
    <a href={url} on:click|preventDefault={linkClickHandler}>
      <MediaLinkPreview {url} />
    </a>
  {/if}
</div>
