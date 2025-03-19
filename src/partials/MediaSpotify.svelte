<script lang="ts">
  import {last} from "@welshman/lib"
  import MediaLinkPreview from "src/partials/MediaLinkPreview.svelte"

  export let url
  export let linkClickHandler

  const id = last(url.split("?")[0].match(/[a-z]+\/[0-9A-z]+$/) || [])
  const src = `https://open.spotify.com/embed/${id}`
</script>

{#if id}
  <iframe
    {src}
    allowfullscreen
    style="border-radius:12px"
    width="100%"
    height="352"
    frameBorder="0"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy" />
{:else}
  <a href={url} on:click|preventDefault={linkClickHandler}>
    <MediaLinkPreview {url} />
  </a>
{/if}
