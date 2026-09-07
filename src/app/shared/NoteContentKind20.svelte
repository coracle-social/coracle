<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {matchTags, tagSpec, tagValue, type TrustedEvent} from "@welshman/util"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import {getSetting} from "src/engine"

  export let note: TrustedEvent
  export let showEntire = true
  export let showMedia = getSetting("show_media")

  // Welshman deleted tagsFromIMeta; an imeta tag's entries are space-delimited key/value pairs
  const tagsFromIMeta = (imeta: string[]) => imeta.map(m => m.split(" "))

  const {title, alt} = fromPairs(note.tags)
  const imeta = matchTags(tagSpec("imeta"), note.tags).map(imeta => tagsFromIMeta(imeta.slice(1)))
  const urls = imeta.map(tags => tagValue(tagSpec("url"), tags))
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
{:else if alt}
  <div class="h-2" />
  <p>{alt}</p>
{/if}
