<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {Address, getTag} from "@welshman/util"
  import {parseLink} from "@welshman/content"
  import Link from "src/partials/Link.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"

  export let note: TrustedEvent
  export let showEntire: boolean
  export let showMedia: boolean

  const meta = fromPairs(note.tags)
  const aTag = getTag("a", note.tags)
  const eTag = getTag("e", note.tags)
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
  {#if aTag}
    {@const naddr = Address.from(aTag[1], aTag.slice(2, 3)).toNaddr()}
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
  {:else if eTag}
    {@const id = eTag[1]}
    {@const relays = eTag.slice(2, 3)}
    {@const author = eTag[3]}
    {@const nevent = nip19.neventEncode({id, relays, author})}
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
</div>
