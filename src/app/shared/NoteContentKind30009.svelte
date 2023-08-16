<script lang="ts">
  import {Tags} from "src/util/nostr"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const {name, description, image} = Tags.from(note).asMeta()
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <p>Created a badge:</p>
  <h3 class="staatliches text-2xl">{name}</h3>
  {#if description}
    <p>{description}</p>
  {/if}
  {#if image}
    <NoteContentLink {showMedia} value={{url: image, isMedia: true}} />
  {/if}
</div>
