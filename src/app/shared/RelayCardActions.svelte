<script lang="ts">
  import {relayPolicyUrls, removeRelay, addRelay, hasRelay} from "src/engine"

  export let relay

  const joined = hasRelay(relay.url)
</script>

{#if !$joined}
  <button class="flex items-center gap-3 text-gray-1" on:click={() => addRelay(relay.url)}>
    <i class="fa fa-right-to-bracket" /> Join
  </button>
{:else if $relayPolicyUrls.length > 1}
  <button class="flex items-center gap-3 text-gray-1" on:click={() => removeRelay(relay.url)}>
    <i class="fa fa-right-from-bracket" /> Leave
  </button>
{/if}
