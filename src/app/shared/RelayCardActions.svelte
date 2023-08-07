<script lang="ts">
  import {user, Nip65, Keys} from "src/app/engine"

  export let relay

  const relays = Nip65.policies.key(Keys.pubkey.get()).derived(() => new Set(user.getRelayUrls()))

  const removeRelay = r => user.removeRelay(r.url)

  const addRelay = r => user.addRelay(r.url)

  $: hasRelay = $relays.has(relay.url)
</script>

{#if !hasRelay}
  <button class="flex items-center gap-3 text-gray-1" on:click={() => addRelay(relay)}>
    <i class="fa fa-right-to-bracket" /> Join
  </button>
{:else if $relays.size > 1}
  <button class="flex items-center gap-3 text-gray-1" on:click={() => removeRelay(relay)}>
    <i class="fa fa-right-from-bracket" /> Leave
  </button>
{/if}
