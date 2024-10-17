<script lang="ts">
  import {deriveProfileDisplay} from "@welshman/app"

  export let pubkey

  const profileDisplay = deriveProfileDisplay(pubkey)
</script>

{$profileDisplay}
