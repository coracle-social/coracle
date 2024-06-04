<script lang="ts">
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {groups} from "src/engine"

  export let address
  export let truncate = true

  const group = groups.key(address)
</script>

<NoteContentKind1
  note={{content: $group?.meta?.about || ""}}
  minLength={100}
  maxLength={140}
  showEntire={!truncate} />
