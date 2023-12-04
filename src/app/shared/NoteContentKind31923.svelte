<script lang="ts">
  import EventInfo from "src/app/shared/EventInfo.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showMedia
</script>

<div class="flex flex-col gap-4 overflow-hidden text-ellipsis">
  <EventInfo event={note} />
  <NoteContentKind1 {note} {showMedia} />
</div>
