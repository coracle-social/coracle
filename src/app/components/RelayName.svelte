<script lang="ts">
  import {deriveRelayDisplay} from "@welshman/app"

  let {url} = $props()

  const display = deriveRelayDisplay(url)
</script>

{$display}
