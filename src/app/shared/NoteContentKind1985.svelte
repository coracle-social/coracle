<script lang="ts">
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showEntire
  export let depth = 0
</script>

<FlexColumn>
  <NoteContentLabel {note} />
  <NoteContentKind1 {note} {showEntire} {depth}>
    <div slot="note-content" let:quote>
      <slot name="note-content" {quote} />
    </div>
  </NoteContentKind1>
</FlexColumn>
