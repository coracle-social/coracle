<script lang="ts">
  import {fromPairs} from "ramda"
  import {getTag, getTagValues, getTagValue, tagsFromIMeta} from "@welshman/util"
  import Chips from "src/partials/Chips.svelte"
  import Media from "src/partials/Media.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const imeta = getTag("imeta", note.tags)
  const categories = getTagValues("c", note.tags)
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
    {@const tags = tagsFromIMeta(imeta.slice(1))}
    <Media url={getTagValue("url", tags)} {tags} />
  {/if}
  {#if cover}
    <NoteContentLink {showMedia} value={{url: cover, isMedia: true}} />
  {/if}
</div>
