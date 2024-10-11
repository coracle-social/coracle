<script lang="ts">
  import {loadProfile, deriveProfileDisplay} from "@welshman/app"

  export let pubkey

  const profileDisplay = deriveProfileDisplay(pubkey)

  loadProfile(pubkey)
</script>

{$profileDisplay}
