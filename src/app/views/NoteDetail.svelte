<script lang="ts">
  import {isMobile} from "src/util/html"
  import {fly} from "src/util/transition"
  import Note from "src/app/shared/Note.svelte"

  export let id = null
  export let relays = []
  export let depth = isMobile ? 2 : 5
</script>

<div in:fly={{y: 20}}>
  <Note showGroup showLoading anchor={id} note={{id}} {depth} {relays} />
</div>
