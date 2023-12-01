<script lang="ts">
  import {Tags} from "paravel"
  import {formatTimestampAsDate} from "src/util/misc"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showMedia

  const {name, start, end} = Tags.from(note).getDict()
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <h3 class="staatliches text-2xl">{name}</h3>
  <p>{formatTimestampAsDate(start)} - {formatTimestampAsDate(end)}</p>
  <NoteContentKind1 {note} {showMedia} />
</div>
