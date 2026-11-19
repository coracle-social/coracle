<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {matchTag, tagSpec} from "@welshman/util"
  import {getExternalContentUrl} from "src/util/nostr"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import NoteContentTopic from "src/app/shared/NoteContentTopic.svelte"

  export let note: TrustedEvent
  export let showEntire: boolean
  export let showMedia: boolean

  // The external content (nip-73) this comment thread is about, if any
  const root = matchTag(tagSpec("I"), note.tags)
  const rootId = root?.[1]
  const rootUrl = root && getExternalContentUrl(root)
</script>

<div class="flex flex-col gap-2">
  <NoteContentKind1 {note} {showEntire} {showMedia} />
  {#if rootId}
    <div class="flex items-center gap-1 text-end text-sm text-neutral-400">
      <i class="fa fa-link fa-xs mt-1" />
      {#if rootUrl}
        <NoteContentLinks urls={[rootUrl]} />
      {:else if rootId.startsWith("#")}
        <NoteContentTopic value={rootId.slice(1)} />
      {:else}
        <span class="overflow-hidden text-ellipsis whitespace-nowrap">{rootId}</span>
      {/if}
    </div>
  {/if}
</div>
