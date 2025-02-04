<script lang="ts">
  import {deriveRelayDisplay} from "@welshman/app"

  const {url} = $props()

  const display = deriveRelayDisplay(url)
</script>

{$display}
