<script lang="ts">
  import MediaAudio from "src/partials/MediaAudio.svelte"
  import MediaSpotify from "src/partials/MediaSpotify.svelte"
  import MediaTidal from "src/partials/MediaTidal.svelte"
  import MediaVideo from "src/partials/MediaVideo.svelte"
  import MediaImage from "src/partials/MediaImage.svelte"
  import MediaLink from "src/partials/MediaLink.svelte"

  export let url: string
  export let fullSize = false
</script>

{#if url.match(/\.(wav|mp3|m3u8)$/)}
  <MediaAudio {url} />
{:else}
  <a
    href={url}
    target="_blank"
    style="background-color: rgba(15, 15, 14, 0.5)"
    class="relative flex w-full flex-grow flex-col overflow-hidden rounded">
    {#if url.match(/open.spotify.com/)}
      <MediaSpotify {url} />
    {:else if url.match(/tidal.com/)}
      <MediaTidal {url} />
    {:else if url.match(/\.(mov|webm|mp4)$/)}
      <MediaVideo {url} />
    {:else if url.match(/\.(jpe?g|png|gif|webp)$/)}
      <MediaImage {url} {fullSize} />
    {:else}
      <MediaLink {url} />
    {/if}
  </a>
{/if}
