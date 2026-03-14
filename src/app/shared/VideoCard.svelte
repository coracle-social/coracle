<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import type {TrustedEvent} from "@welshman/util"
  import {getTagValue} from "@welshman/util"
  import {Router} from "@welshman/router"
  import {displayProfileByPubkey} from "@welshman/app"
  import {imgproxy} from "src/engine"
  import {router} from "src/app/util/router"

  export let event: TrustedEvent

  const findTag = (keys: string[]) => {
    for (const key of keys) {
      const val = getTagValue(key, event.tags)
      if (val) return val
    }
    return ""
  }

  const title = findTag(["title"]) || "Video"
  const videoUrl = findTag(["url", "r"])
  const thumbUrl = findTag(["image", "thumb", "thumbnail_ipfs"])
  const gifanimUrl = findTag(["gifanim", "gif", "gifanim_ipfs"])
  const duration = parseInt(findTag(["duration"]) || "0")
  const isShort = event.kind === 22 || duration <= 60
  const sourceType = (() => {
    const src = event.tags.find(t => t[0] === "i" && t[1]?.startsWith("source:"))
    if (src) return src[1].replace("source:", "")
    if (event.tags.some(t => t[0] === "t" && t[1] === "youtube")) return "youtube"
    if (event.tags.some(t => t[0] === "t" && t[1] === "film")) return "film"
    if (event.tags.some(t => t[0] === "t" && t[1] === "serie")) return "serie"
    return ""
  })()

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  const authorDisplay = displayProfileByPubkey(event.pubkey)

  // Open note detail (with video player + like/reply/zap/share actions)
  const openNote = () => {
    const nevent = nip19.neventEncode({
      id: event.id,
      kind: event.kind,
      author: event.pubkey,
      relays: Router.get().Event(event).limit(3).getUrls(),
    })
    router.at("notes").of(nevent).open()
  }

  const openProfile = (e: MouseEvent) => {
    e.stopPropagation()
    router.at("people").of(event.pubkey).open()
  }
</script>

<button
  class="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-transparent bg-neutral-800 transition-all hover:-translate-y-0.5 hover:border-accent"
  on:click={openNote}>
  <!-- Thumbnail 16:9 -->
  <div class="relative aspect-video w-full overflow-hidden bg-neutral-900">
    {#if thumbUrl}
      <img
        src={imgproxy(thumbUrl, {w: 320, h: 180})}
        alt={title}
        class="thumb-static h-full w-full object-cover transition-opacity"
        class:group-hover:opacity-0={!!gifanimUrl} />
      {#if gifanimUrl}
        <img
          src={gifanimUrl}
          alt=""
          class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100" />
      {/if}
    {:else}
      <div class="flex h-full items-center justify-center text-3xl text-neutral-600">
        <i class="fa fa-video" />
      </div>
    {/if}

    <!-- Play icon overlay -->
    <div
      class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
      <i class="fa fa-play-circle text-4xl text-white drop-shadow-lg" />
    </div>

    <!-- Duration badge -->
    {#if duration > 0}
      <span
        class="absolute bottom-1 right-1 rounded bg-black bg-opacity-80 px-1.5 py-0.5 text-xs text-white">
        {formatDuration(duration)}
      </span>
    {/if}

    <!-- Short badge -->
    {#if isShort}
      <span
        class="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-white">
        Short
      </span>
    {/if}

    <!-- Source badge -->
    {#if sourceType}
      <span
        class="absolute right-1 top-1 rounded px-1.5 py-0.5 text-xs font-semibold text-white"
        class:bg-red-600={sourceType === "youtube"}
        class:bg-blue-600={sourceType === "film"}
        class:bg-purple-600={sourceType === "serie"}
        class:bg-neutral-600={!["youtube", "film", "serie"].includes(sourceType)}>
        {sourceType}
      </span>
    {/if}
  </div>

  <!-- Info -->
  <div class="flex flex-col gap-1 p-2">
    <span
      class="line-clamp-2 text-left text-sm font-medium leading-tight text-neutral-100">
      {title}
    </span>
    <button
      class="text-left text-xs text-neutral-400 hover:text-accent"
      on:click={openProfile}>
      {authorDisplay}
    </button>
  </div>
</button>
