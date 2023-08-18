<script lang="ts">
  import {marked} from "marked"
  import insane from "insane"
  import {Tags} from "src/util/nostr"
  import {urlIsMedia} from "src/util/notes"
  import {modal} from "src/partials/state"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showEntire
  export let showMedia = false

  const tags = Tags.from(note)
  const {title, summary, image} = tags.asMeta() as {[k: string]: string}

  const openTopic = topic => {
    modal.push({type: "topic/feed", topic})
  }
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <h3 class="staatliches text-2xl">{title}</h3>
  {#if summary && !showEntire}
    <p>{summary}</p>
  {/if}
  {#if showMedia && image && urlIsMedia(image)}
    <NoteContentLink value={{url: image, isMedia: true}} showMedia />
  {/if}
  <div>
    {#each tags.topics() as topic}
      <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => openTopic(topic)}>
        #{topic}
      </Chip>
    {/each}
  </div>
</div>

{#if showEntire}
  <div class="long-form-content flex flex-col gap-4 overflow-hidden text-ellipsis leading-6">
    {@html insane(marked.parse(note.content))}
  </div>
{/if}
