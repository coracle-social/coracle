<script lang="ts">
  import {deriveRelay} from '@welshman/app'

  export let url

  const relay = deriveRelay(url)
</script>

{#if $relay?.profile?.description}
  <p>{$relay?.profile.description}</p>
{/if}
