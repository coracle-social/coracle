<script context="module" lang="ts">
  const thumbnailCache = new Map<string, string>()
</script>

<script lang="ts">
  export let url

  let loaded = false
  let thumbnail: string | null = null
  let videoEl: HTMLVideoElement | null = null

  $: if (url) {
    loaded = false
    thumbnail = thumbnailCache.get(url) ?? null
  }

  const captureThumbnail = () => {
    if (!videoEl || thumbnail) {
      return
    }

    const {videoWidth, videoHeight} = videoEl

    if (!videoWidth || !videoHeight) {
      return
    }

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
      return
    }

    canvas.width = videoWidth
    canvas.height = videoHeight

    try {
      context.drawImage(videoEl, 0, 0, videoWidth, videoHeight)
      thumbnail = canvas.toDataURL("image/jpeg", 0.7)
      thumbnailCache.set(url, thumbnail)
    } catch (error) {
      // Ignore cross-origin or rendering failures.
    }
  }

  const onLoad = () => {
    loaded = true
    captureThumbnail()
  }
</script>

<video
  controls
  bind:this={videoEl}
  src={url}
  on:loadeddata={onLoad}
  on:click|stopPropagation
  class:hidden={!loaded}
  class="max-h-96 object-contain object-center" />

{#if !loaded}
  {#if thumbnail}
    <img src={thumbnail} alt="" class="max-h-96 object-contain object-center" />
  {:else}
    <div class="shimmer h-64 w-96" />
  {/if}
{/if}
