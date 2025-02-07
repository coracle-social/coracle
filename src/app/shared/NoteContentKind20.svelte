<script lang="ts">
  import {fromPairs} from '@welshman/lib'
  import {getTags, getTagValue, tagsFromIMeta, type TrustedEvent} from "@welshman/util"
  import Carousel from "src/app/shared/Carousel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import {getSetting} from "src/engine"

  export let note: TrustedEvent
  export let showEntire = true
  export let showMedia = getSetting("show_media")

  const {title, alt} = fromPairs(note.tags)

  let imeta = getTags("imeta", note.tags).map(imeta => tagsFromIMeta(imeta.slice(1)))

  const onError = url => {
    imeta = imeta.filter(i => i !== url)
  }
</script>

{#if title}
  <h1 class="staatliches text-2xl">{title}</h1>
{/if}
{#if imeta.length > 0}
  {#if showMedia}
    <Carousel items={imeta} let:item>
      <img src={item.toString()} {alt} class="min-w-full" on:error={() => onError(item)} />
    </Carousel>
  {:else}
    {#each imeta as tags}
      <NoteContentLink url={getTagValue('url', tags)} {showMedia} />
    {/each}
  {/if}
{/if}
{#if note.content}
  <div class="h-2" />
  <NoteContentKind1 {note} {showEntire} />
{/if}
