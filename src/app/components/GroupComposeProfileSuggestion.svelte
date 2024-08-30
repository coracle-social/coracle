<script lang="ts">
  import {deriveProfileDisplay} from "@welshman/app"

  export let value

  const display = deriveProfileDisplay(value)
</script>

@{$display}
