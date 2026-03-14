<script lang="ts">
  import {getTagValue, getTagValues} from "@welshman/util"
  import {imgproxy} from "src/engine"
  import {router} from "src/app/util/router"

  export let note
  export let showMedia = false

  // NIP-71 tag extraction (inspired by nostr.html extractNostrTubeVideo)
  const findTag = (keys: string[]) => {
    for (const key of keys) {
      const val = getTagValue(key, note.tags)
      if (val) return val
    }
    return ""
  }

  const title = findTag(["title"]) || "Video"
  const videoUrl = findTag(["url", "r"])
  const thumbUrl = findTag(["image", "thumb", "thumbnail_ipfs"])
  const gifanimUrl = findTag(["gifanim", "gif", "gifanim_ipfs"])
  const duration = parseInt(findTag(["duration"]) || "0")
  const isShort = note.kind === 22 || duration <= 60
  const topics = getTagValues("t", note.tags)

  // Parse imeta fallback for video URL
  const imetaTag = note.tags.find(t => t[0] === "imeta")
  let imetaUrl = ""
  if (imetaTag) {
    for (let i = 1; i < imetaTag.length; i++) {
      if (typeof imetaTag[i] === "string" && imetaTag[i].startsWith("url ")) {
        imetaUrl = imetaTag[i].substring(4).trim()
      }
    }
  }

  const effectiveVideoUrl = videoUrl || imetaUrl
  const previewUrl = gifanimUrl || thumbUrl

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  const openVideo = (e: PointerEvent) => {
    if (e.metaKey) return window.open(effectiveVideoUrl, "_blank")
    if (effectiveVideoUrl) {
      router.at("media").of(effectiveVideoUrl).open({overlay: true})
    }
  }
</script>

<div class="flex flex-col gap-2 overflow-hidden">
  <div class="flex items-start gap-2">
    {#if title}
      <h3 class="flex-1 text-lg font-bold">{title}</h3>
    {/if}
    {#if duration > 0}
      <span class="whitespace-nowrap rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
        {isShort ? "Short" : "Video"} · {formatDuration(duration)}
      </span>
    {/if}
  </div>

  {#if showMedia && previewUrl}
    <!-- Thumbnail/GIF preview — click to open video in modal -->
    <button
      class="relative w-full cursor-pointer overflow-hidden rounded"
      on:click|stopPropagation={openVideo}>
      <img
        src={imgproxy(previewUrl)}
        alt={title}
        class="h-auto max-h-96 w-full object-cover" />
      <div
        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity hover:bg-opacity-10">
        <i class="fa fa-play-circle text-5xl text-white drop-shadow-lg" />
      </div>
    </button>
  {:else if showMedia && effectiveVideoUrl}
    <!-- No preview available — show video player directly -->
    <video
      controls
      preload="metadata"
      src={effectiveVideoUrl}
      on:click|stopPropagation
      class="max-h-96 w-full rounded object-contain" />
  {/if}

  {#if note.content}
    <p class="text-neutral-100">{note.content}</p>
  {/if}

  {#if topics.length > 0}
    <div class="flex flex-wrap gap-1">
      {#each topics as topic}
        <span class="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">#{topic}</span>
      {/each}
    </div>
  {/if}
</div>
