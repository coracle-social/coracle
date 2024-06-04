<script lang="ts">
  import {derived} from "svelte/store"
  import {leaveRelay, joinRelay, userRelayPolicies, broadcastUserData} from "src/engine"

  export let relay
  export let claim = null

  const joined = derived(userRelayPolicies, $policies =>
    Boolean($policies.find(p => p.url === relay.url)),
  )

  const join = () => joinRelay(relay.url, claim)

  const leave = () => leaveRelay(relay.url)
</script>

{#if !$joined}
  <button class="flex items-center gap-3 text-neutral-100" on:click={join}>
    <i class="fa fa-right-to-bracket" /> Join
  </button>
{:else if $userRelayPolicies.length > 1}
  <button class="flex items-center gap-3 text-neutral-100" on:click={leave}>
    <i class="fa fa-right-from-bracket" /> Leave
  </button>
{/if}
