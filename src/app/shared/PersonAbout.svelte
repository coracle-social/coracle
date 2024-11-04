<script lang="ts">
  import {deriveProfile} from "@welshman/app"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let pubkey
  export let truncate = false

  const profile = deriveProfile(pubkey)
</script>

<NoteContentKind1
  note={{content: $profile?.about || "", tags: []}}
  class={$$props.class}
  minLength={200}
  maxLength={300}
  expandable={false}
  showEntire={!truncate} />
