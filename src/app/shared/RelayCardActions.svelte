<script lang="ts">
  import {
    pubkey,
    getRelayUrls,
    deriveRelaySelections,
    deriveInboxRelaySelections,
  } from "@welshman/app"
  import {leaveRelay, joinRelay} from "src/engine"

  export let url
  export let claim = null

  const userRelaySelections = deriveRelaySelections($pubkey)

  const userInboxRelaySelections = deriveInboxRelaySelections($pubkey)

  const join = () => joinRelay(url, claim)

  const leave = () => leaveRelay(url)

  $: userRelayUrls = [
    ...getRelayUrls($userRelaySelections),
    ...getRelayUrls($userInboxRelaySelections),
  ]
</script>

{#if !userRelayUrls.includes(url)}
  <button class="flex items-center gap-3 text-neutral-100" on:click={join}>
    <i class="fa fa-right-to-bracket" /> Join
  </button>
{:else if userRelayUrls.length > 1}
  <button class="flex items-center gap-3 text-neutral-100" on:click={leave}>
    <i class="fa fa-right-from-bracket" /> Leave
  </button>
{/if}
