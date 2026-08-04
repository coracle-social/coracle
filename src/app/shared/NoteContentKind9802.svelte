<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {fromPairs, tryCatch} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {Address, getTag, getTopicTagValues, isRelayUrl} from "@welshman/util"
  import {parseLink} from "@welshman/content"
  import Link from "src/partials/Link.svelte"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"

  export let note: TrustedEvent
  export let showEntire: boolean
  export let showMedia: boolean

  const meta = fromPairs(note.tags)
  const aTag = getTag("a", note.tags)
  const eTag = getTag("e", note.tags)

  // Tag values are user-provided, so validate them before encoding
  const isPubkey = (value?: string) => Boolean(value?.match(/^[0-9a-f]{64}$/))
  const getRelays = (tag: string[]) => tag.slice(2, 3).filter(isRelayUrl)

  // Marked e tags put the marker at index 3 and the pubkey hint at index 4
  const author = [eTag?.[4], eTag?.[3]].find(isPubkey)

  const naddr = aTag && tryCatch(() => Address.from(aTag[1], getRelays(aTag)).toNaddr())
  const nevent =
    eTag && tryCatch(() => nip19.neventEncode({id: eTag[1], relays: getRelays(eTag), author}))
</script>

<div class="flex flex-col gap-2">
  {#if meta.comment}
    <NoteContentKind1 note={{content: meta.comment}} {showMedia} {showEntire} />
  {/if}
  <div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
    <div class="border-l-2 border-solid border-neutral-600 pl-4">
      <NoteContentKind1 {note} {showEntire} />
    </div>
  </div>
  {#if naddr}
    <div class="flex items-center gap-1 text-end text-sm text-neutral-400">
      <i class="fa fa-highlighter fa-xs mt-1" />
      <Link
        modal
        stopPropagation
        class="overflow-hidden text-ellipsis whitespace-nowrap underline"
        href={naddr}>
        {naddr.slice(0, 16) + "…"}
      </Link>
    </div>
  {:else if nevent}
    <div class="flex items-center gap-1 text-end text-sm text-neutral-400">
      <i class="fa fa-highlighter fa-xs mt-1" />
      <Link
        modal
        stopPropagation
        class="overflow-hidden text-ellipsis whitespace-nowrap underline"
        href={nevent}>
        {nevent.slice(0, 16) + "…"}
      </Link>
    </div>
  {:else if meta.r}
    <div class="flex items-center gap-1 text-end text-sm text-neutral-400">
      <i class="fa fa-highlighter fa-xs mt-1" />
      {#if parseLink(meta.r, {results: [], content: "", tags: []})}
        <NoteContentLinks urls={[meta.r]} />
      {:else}
        {meta.r}
      {/if}
    </div>
  {/if}
  <div>
    {#each getTopicTagValues(note.tags) as topic}
      <NoteContentTopic value={topic}>
        <Chip class="mb-2 mr-2 inline-block cursor-pointer">#{topic}</Chip>
      </NoteContentTopic>
    {/each}
  </div>
</div>
