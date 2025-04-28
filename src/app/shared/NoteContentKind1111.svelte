<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {getTagValue} from "@welshman/util"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"

  export let note: TrustedEvent
  export let showEntire: boolean
  export let showMedia: boolean

  const linkParent = getTagValue("I", note.tags)
</script>

<div class="flex flex-col gap-2">
  <NoteContentKind1 {note} {showEntire} />
  {#if linkParent}
    <div class="flex items-center gap-1 text-end text-sm text-neutral-400">
      <i class="fa fa-link fa-xs mt-1" />
      <NoteContentLinks urls={[linkParent]} />
    </div>
  {/if}
</div>
