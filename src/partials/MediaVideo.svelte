<script context="module" lang="ts">
  const thumbnailCache = new Map<string, string>()
</script>

<script lang="ts">
  import {onMount} from "svelte"
  import {Capacitor} from "@capacitor/core"
  import {CapgoVideoThumbnails} from "@capgo/capacitor-video-thumbnails"

  export let url: string

  let thumbnail = thumbnailCache.get(url)
  let loaded = Boolean(thumbnail)

  const captureThumbnail = async () => {
    if (thumbnail) {
      return
    }

    try {
      const {uri} = await CapgoVideoThumbnails.getThumbnail({
        sourceUri: url,
        time: 0,
        quality: 0.7,
      })

      const resolvedUri = Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(uri) : uri

      thumbnail = resolvedUri
      thumbnailCache.set(url, thumbnail)
    } catch (error) {
      // Ignore thumbnail generation failures.
    }
  }

  const onLoad = () => {
    loaded = true
  }

  onMount(() => {
    if (url && !thumbnail) {
      captureThumbnail()
    }
  })
</script>

<video
  controls
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
