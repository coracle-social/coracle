<script lang="ts">
  import {nip05, nip19} from "nostr-tools"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"

  export let person

  let nip05ProfileData = null
  let nprofile = null
  let npub = nip19.npubEncode(person.pubkey)
  let loaded = false

  onMount(async () => {
    if (person.verified_as) {
      nprofile = nip19.nprofileEncode({
        pubkey: person.pubkey,
        relays: person.relays,
      })

      try {
        nip05ProfileData = await nip05.queryProfile(person.verified_as)
      } catch (e) {
        // Pass
      }

      // recalculate nprofile using NIP05 relay data, if specified.
      // In theory, those *should* be the user's prefered relay set.
      if (nip05ProfileData?.relays?.length) {
        nprofile = nip19.nprofileEncode({
          pubkey: person.pubkey,
          relays: nip05ProfileData.relays,
        })
      }
    }

    loaded = true
  })
</script>

<div in:fly={{y: 20}}>
  <Content>
    <h1 class="staatliches text-2xl">Profile Details</h1>
    <CopyValue label="Public Key (Hex)" value={person.pubkey} />
    <CopyValue label="Public Key (npub)" value={npub} />
    {#if nprofile}
      <CopyValue label="Profile Link" value={nprofile} />
    {/if}

    <h1 class="staatliches mt-4 text-2xl">NIP05</h1>

    {#if loaded && person.verified_as}
      <CopyValue label="NIP 05 Identifier" value={person.verified_as} />
      {#if nip05ProfileData}
        <div>
          <div class="mb-2 text-lg">NIP05 Relay Configuration</div>
          {#if nip05ProfileData?.relays?.length}
            <p class="mb-4 text-sm text-gray-1">
              These relays are advertised by the NIP05 identifier's validation endpoint.
            </p>
            <div class="grid grid-cols-1 gap-4">
              {#each nip05ProfileData?.relays as url}
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
        <p>
          <i class="fa-solid fa-warning mr-2 text-warning" />
          Could not fetch NIP05 data.
        </p>
      {/if}
    {:else}
      <p class="mb-4 text-sm text-gray-1">
        <i class="fa-solid fa-info-circle" />
        NIP05 identifier not available.
      </p>
    {/if}
  </Content>
</div>
