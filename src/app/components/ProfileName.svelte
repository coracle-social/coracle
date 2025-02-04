<script lang="ts">
  import {deriveProfileDisplay} from "@welshman/app"

  const {pubkey} = $props()

  const profileDisplay = deriveProfileDisplay(pubkey)
</script>

{$profileDisplay}
