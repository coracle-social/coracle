<script lang="ts">
  import MediaAudio from "src/partials/MediaAudio.svelte"
  import MediaSpotify from "src/partials/MediaSpotify.svelte"
  import MediaTidal from "src/partials/MediaTidal.svelte"
  import MediaVideo from "src/partials/MediaVideo.svelte"
  import MediaImage from "src/partials/MediaImage.svelte"
  import MediaLinkPreview from "src/partials/MediaLinkPreview.svelte"

  export let url: string
  export let fullSize = false
  export let onClick: (event: any) => void = undefined
</script>

{#if url.match(/\.(wav|mp3|m3u8)$/)}
  <MediaAudio {url} />
{:else}
  <a
    href={url}
    on:click|preventDefault={onClick}
    class="relative flex flex-grow flex-col overflow-hidden rounded bg-neutral-800">
    {#if url.match(/open.spotify.com/)}
      <MediaSpotify {url} />
    {:else if url.match(/tidal.com/)}
      <MediaTidal {url} />
    {:else if url.match(/\.(mov|webm|mp4)$/)}
      <MediaVideo {url} />
    {:else if url.match(/\.(jpe?g|png|gif|webp)$/)}
      <MediaImage {url} {fullSize} />
    {:else}
      <MediaLinkPreview {url} />
    {/if}
  </a>
{/if}
