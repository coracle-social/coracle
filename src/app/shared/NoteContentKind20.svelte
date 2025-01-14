<script lang="ts">
  import {getTags, getTagValue, tagsFromIMeta, type TrustedEvent} from "@welshman/util"
  import Carousel from "src/app/shared/Carousel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note: TrustedEvent
  export let showEntire = true

  const images = getTags("imeta", note.tags).map(imeta => tagsFromIMeta(imeta.slice(1)))
  const title = getTagValue("title", note.tags)
</script>

{#if title}
  <h1 class="staatliches text-2xl">{title}</h1>
{/if}
<Carousel items={images} let:item>
  <img src={getTagValue("url", item)} alt={getTagValue("alt", item)} class="min-w-full" />
</Carousel>
<div class="h-2" />
<NoteContentKind1 {note} {showEntire} />
