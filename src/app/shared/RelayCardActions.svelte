<script lang="ts">
  import {relayPolicyUrls, leaveRelay, joinRelay, deriveHasRelay} from "src/engine"

  export let relay

  const joined = deriveHasRelay(relay.url)
</script>

{#if !$joined}
  <button class="flex items-center gap-3 text-gray-1" on:click={() => joinRelay(relay.url)}>
    <i class="fa fa-right-to-bracket" /> Join
  </button>
{:else if $relayPolicyUrls.length > 1}
  <button class="flex items-center gap-3 text-gray-1" on:click={() => leaveRelay(relay.url)}>
    <i class="fa fa-right-from-bracket" /> Leave
  </button>
{/if}
