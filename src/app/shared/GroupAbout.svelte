<script lang="ts">
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {deriveGroupMeta} from "src/engine"

  export let address
  export let truncate = true

  const meta = deriveGroupMeta(address)
</script>

{#key $meta?.about}
  <NoteContentKind1
    note={{content: $meta?.about || ""}}
    minLength={100}
    maxLength={140}
    showEntire={!truncate} />
{/key}
