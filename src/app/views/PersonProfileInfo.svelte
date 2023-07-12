<script lang="ts">
  import {nip19} from "nostr-tools"
  import {fly} from "src/util/transition"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import {nip05, routing} from "src/app/engine"

  export let pubkey

  const handle = nip05.getHandle(pubkey)
  const npub = nip19.npubEncode(pubkey)
  const relays = routing.getPubkeyHints(3, pubkey)
  const nprofile = nip19.nprofileEncode({pubkey, relays})
</script>

<div in:fly={{y: 20}}>
  <Content>
    <h1 class="staatliches text-2xl">Profile Details</h1>
    <CopyValue label="Public Key (Hex)" value={pubkey} />
    <CopyValue label="Public Key (npub)" value={npub} />
    {#if nprofile}
      <CopyValue label="Profile Link" value={nprofile} />
    {/if}

    <h1 class="staatliches mt-4 text-2xl">NIP05</h1>

    {#if handle}
      <CopyValue label="NIP 05 Identifier" value={nip05.displayHandle(handle)} />
      <div>
        <div class="mb-2 text-lg">NIP05 Relay Configuration</div>
        {#if handle.profile.relays?.length > 0}
          <p class="mb-4 text-sm text-gray-1">
            These relays are advertised by the NIP05 identifier's validation endpoint.
          </p>
          <div class="grid grid-cols-1 gap-4">
            {#each handle.profile.relays as url}
              <RelayCard relay={{url}} />
            {/each}
          </div>
        {:else}
          <p class="mb-4 text-sm">
            <i class="fa-solid fa-info-circle" />
            No relays are advertised by the NIP05 identifier's validation endpoint.
          </p>
        {/if}
      </div>
    {:else}
      <p class="mb-4 text-sm text-gray-1">
        <i class="fa-solid fa-info-circle" />
        NIP05 identifier not available.
      </p>
    {/if}
  </Content>
</div>
