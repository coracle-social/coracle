<script lang="ts">
  import {deriveRelayDisplay} from '@welshman/app'

  export let url

  const display = deriveRelayDisplay(url)
</script>

{$display}
