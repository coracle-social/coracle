<script lang="ts">
  import {nip19} from "nostr-tools"
  import {deriveProfile, deriveHandleForPubkey, displayHandle, AppContext} from "@welshman/app"
  import CopyValue from "src/partials/CopyValue.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const handle = deriveHandleForPubkey(pubkey)
  const relays = AppContext.router.FromPubkeys([pubkey]).getUrls()

  $: lightningAddress = $profile?.lud16 || $profile?.lud06
</script>

<h1 class="staatliches text-2xl">Details</h1>
<CopyValue label="Link" value={nip19.nprofileEncode({pubkey, relays})} />
<CopyValue label="Public Key" encode={nip19.npubEncode} value={pubkey} />
{#if $handle}
  {@const display = displayHandle($handle)}
  <CopyValue label="Nostr Address" value={display} />
  <strong>Nostr Address Relays</strong>
  {#each $handle.relays || [] as url}
    <RelayCard {url} />
  {:else}
    <p class="flex gap-2 items-center">
      <i class="fa fa-info-circle" />
      No relays are advertised at {display}.
    </p>
  {/each}
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    No Nostr address found.
  </p>
{/if}
{#if lightningAddress}
  <CopyValue label="Lightning Address" value={lightningAddress} />
{:else}
  <p>
    <i class="fa-solid fa-info-circle" />
    No lightning address found.
  </p>
{/if}
