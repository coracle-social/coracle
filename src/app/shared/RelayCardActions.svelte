<script lang="ts">
  import {
    relayPolicyUrls,
    leaveRelay,
    joinRelay,
    deriveHasRelay,
    broadcastUserData,
  } from "src/engine"

  export let relay
  export let claim = null

  const joined = deriveHasRelay(relay.url)

  const join = () => {
    joinRelay(relay.url, claim)
    broadcastUserData([relay.url])
  }

  const leave = () => leaveRelay(relay.url)
</script>

{#if !$joined}
  <button class="flex items-center gap-3 text-neutral-100" on:click={join}>
    <i class="fa fa-right-to-bracket" /> Join
  </button>
{:else if $relayPolicyUrls.length > 1}
  <button class="flex items-center gap-3 text-neutral-100" on:click={leave}>
    <i class="fa fa-right-from-bracket" /> Leave
  </button>
{/if}
