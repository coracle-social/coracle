<script lang="ts">
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, maxLength, showEntire
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <NoteContentLabel {note} />
  <NoteContentKind1 {note} {maxLength} {showEntire} />
</div>
