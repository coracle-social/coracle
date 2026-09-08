<script lang="ts">
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showEntire
</script>

<FlexColumn>
  <NoteContentLabel {note} />
  <NoteContentKind1 {note} {showEntire} />
</FlexColumn>
