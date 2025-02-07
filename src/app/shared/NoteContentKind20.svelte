<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {getTags, getTagValue, tagsFromIMeta, type TrustedEvent} from "@welshman/util"
  import Carousel from "src/app/shared/Carousel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import {getSetting} from "src/engine"

  export let note: TrustedEvent
  export let showEntire = true
  export let showMedia = getSetting("show_media")

  const {title, alt} = fromPairs(note.tags)
  const imeta = getTags("imeta", note.tags).map(imeta => tagsFromIMeta(imeta.slice(1)))
  const urls = imeta.map(tags => getTagValue("url", tags))
</script>

{#if title}
  <h1 class="staatliches text-2xl">{title}</h1>
{/if}
{#if urls.length > 0}
  <NoteContentLinks {urls} {showMedia} />
{/if}
{#if note.content}
  <div class="h-2" />
  <NoteContentKind1 {note} {showEntire} />
{/if}
