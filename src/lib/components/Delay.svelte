<script lang="ts">
  import {sleep} from '@welshman/lib'

  export let delay = 1
</script>

{#await sleep(delay)}
  <!-- pass -->
{:then}
  <slot />
{/await}
