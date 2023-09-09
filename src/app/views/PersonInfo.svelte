<script lang="ts">
  import {nip19} from "nostr-tools"
  import {fly} from "src/util/transition"
  import Content from "src/partials/Content.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {getSetting} from "src/engine2"
  import {Nip05, Nip65} from "src/app/engine"

  export let pubkey

  const handle = Nip05.getHandle(pubkey)
  const relays = Nip65.getPubkeyHints(getSetting("relay_limit"), pubkey, "write")
  const nprofile = nip19.nprofileEncode({pubkey, relays})
</script>

<div in:fly={{y: 20}}>
  <Content>
    <h1 class="staatliches text-2xl">Details</h1>
    <CopyValue label="Link" value={nprofile} />
    <CopyValue label="Public Key" encode={nip19.npubEncode} value={pubkey} />
    {#if handle}
      {@const display = Nip05.displayHandle(handle)}
      <CopyValue label="Nostr Address" value={display} />
      <Content size="inherit" gap="gap-2">
        <strong>Nostr Address Relays</strong>
        {#each handle.profile.relays || [] as url}
          <RelayCard relay={{url}} />
        {:else}
          <p class="flex gap-2 items-center">
            <i class="fa fa-info-circle" />
            No relays are advertised at {display}.
          </p>
        {/each}
      </Content>
    {:else}
      <p>
        <i class="fa-solid fa-info-circle" />
        Nostr Address address not available.
      </p>
    {/if}
  </Content>
</div>
