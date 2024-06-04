<script lang="ts">
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {deriveProfile} from "src/engine"

  export let pubkey
  export let truncate = false

  const profile = deriveProfile(pubkey)
</script>

<NoteContentKind1
  note={{content: $profile?.about || ""}}
  minLength={100}
  maxLength={140}
  showEntire={!truncate} />
