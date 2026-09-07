<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {matchTag, tagSpec, tagValue, tagValues} from "@welshman/util"
  import {tagsFromIMeta} from "src/util/nostr"
  import Chips from "src/partials/Chips.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"

  export let note: TrustedEvent
  export let showMedia: boolean

  const imeta = matchTag(tagSpec("imeta"), note.tags)
  const categories = tagValues(tagSpec("c"), note.tags)
  const {cover, subject, title} = fromPairs(note.tags)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <div class="flex justify-between">
    <h3 class="staatliches text-2xl">{title || subject}</h3>
    <Chips items={categories}>
      <div slot="item" let:item>
        <i class="fa fa-tag" />
        {item}
      </div>
    </Chips>
  </div>
  {#if imeta}
    <NoteContentLinks
      {showMedia}
      urls={[tagValue(tagSpec("url"), tagsFromIMeta(imeta.slice(1)))]} />
  {/if}
  {#if cover}
    <NoteContentLinks {showMedia} urls={[cover]} />
  {/if}
</div>
