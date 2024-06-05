<script lang="ts">
  import {derived} from "svelte/store"
  import {leaveRelay, joinRelay, userRelayPolicies} from "src/engine"

  export let url
  export let claim = null

  const joined = derived(userRelayPolicies, $policies =>
    Boolean($policies.find(p => p.url === url)),
  )

  const join = () => joinRelay(url, claim)

  const leave = () => leaveRelay(url)
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
