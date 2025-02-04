<script lang="ts">
  import {deriveProfileDisplay} from "@welshman/app"

  let {pubkey} = $props()

  const profileDisplay = deriveProfileDisplay(pubkey)
</script>

{$profileDisplay}
