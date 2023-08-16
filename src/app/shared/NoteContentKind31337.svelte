<script lang="ts">
  import {Tags} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const {c, cover, media, subject} = Tags.from(note).asMeta()
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <div class="flex justify-between">
    <h3 class="staatliches text-2xl">{subject}</h3>
    <Chip><i class="fa fa-tag" /> {c}</Chip>
  </div>
  {#if media}
    <NoteContentLink {showMedia} value={{url: media, isMedia: true}} />
  {:else if cover}
    <NoteContentLink {showMedia} value={{url: cover, isMedia: true}} />
  {/if}
</div>
