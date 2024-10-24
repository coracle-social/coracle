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
  <button
    class="flex items-center rounded-md bg-accent px-6 py-1 text-sm font-bold capitalize text-white"
    on:click={join}>
    JOIN
  </button>
{:else if userRelayUrls.length > 1}
  <button
    class="flex items-center rounded-md bg-tinted-700-d px-6 py-1 text-sm font-bold capitalize text-neutral-100"
    on:click={leave}>
    LEAVE
  </button>
{/if}
