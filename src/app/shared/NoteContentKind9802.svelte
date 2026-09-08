<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {first, tryCatch} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {Address, isRelayUrl} from "@welshman/util"
  import {Highlight} from "@welshman/domain"
  import {parseLink} from "@welshman/content"
  import Link from "src/partials/Link.svelte"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"
  import {reader} from "src/engine/core"

  export let note: TrustedEvent
  export let showEntire: boolean
  export let showMedia: boolean

  const highlight = reader(Highlight)(note)
  const comment = highlight.comment()
  const sources = highlight.sources()
  const author = first(highlight.attributions())?.pubkey

  const addressSource = sources.find(source => source.type === "address")
  const eventSource = sources.find(source => source.type === "event")
  const referenceSource = sources.find(source => source.type === "reference")

  const hints = (url: string) => [url].filter(isRelayUrl)

  const naddr =
    addressSource &&
    tryCatch(() => Address.from(addressSource.address, hints(addressSource.relay)).toNaddr())

  const nevent =
    eventSource &&
    tryCatch(() =>
      nip19.neventEncode({id: eventSource.id, relays: hints(eventSource.relay), author}),
    )
</script>

<div class="flex flex-col gap-2">
  {#if comment}
    <NoteContentKind1 note={{content: comment}} {showMedia} {showEntire} />
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
  {:else if referenceSource}
    <div class="flex items-center gap-1 text-end text-sm text-neutral-400">
      <i class="fa fa-highlighter fa-xs mt-1" />
      {#if parseLink(referenceSource.value, {results: [], content: "", tags: []})}
        <NoteContentLinks urls={[referenceSource.value]} />
      {:else}
        {referenceSource.value}
      {/if}
    </div>
  {/if}
  <div>
    {#each highlight.topics() as topic}
      <NoteContentTopic value={topic}>
        <Chip class="mb-2 mr-2 inline-block cursor-pointer">#{topic}</Chip>
      </NoteContentTopic>
    {/each}
  </div>
</div>
