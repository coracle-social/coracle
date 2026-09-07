<script lang="ts">
  import {Profiles} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let pubkey
  export let truncate = false

  const profile = fromApp($app => $app.use(Profiles).one(pubkey))
</script>

<NoteContentKind1
  note={{content: $profile?.about() || "", tags: []}}
  class={$$props.class}
  minLength={200}
  maxLength={300}
  expandable={false}
  showEntire={!truncate} />
