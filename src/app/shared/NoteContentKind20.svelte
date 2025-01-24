<script lang="ts">
  import {getTags, getTagValue, tagsFromIMeta, type TrustedEvent} from "@welshman/util"
  import Carousel from "src/app/shared/Carousel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import {getSetting} from "src/engine"

  export let note: TrustedEvent
  export let showEntire = true
  export let showMedia = getSetting("show_media")

  const images = getTags("imeta", note.tags).map(imeta => tagsFromIMeta(imeta.slice(1)))
  const title = getTagValue("title", note.tags)
</script>

{#if title}
  <h1 class="staatliches text-2xl">{title}</h1>
{/if}
{#if showMedia}
  <Carousel items={images} let:item>
    <img src={getTagValue("url", item)} alt={getTagValue("alt", item)} class="min-w-full" />
  </Carousel>
{:else}
  {#each images as item}
    <NoteContentLink value={{url: getTagValue("url", item)}} {showMedia} />
  {/each}
{/if}
{#if note.content}
  <div class="h-2" />
  <NoteContentKind1 {note} {showEntire} />
{/if}
