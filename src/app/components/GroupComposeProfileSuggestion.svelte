<script lang="ts">
  import {deriveProfileDisplay} from "@app/state"

  export let value

  const display = deriveProfileDisplay(value)
</script>

@{$display}
