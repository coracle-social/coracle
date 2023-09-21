<script lang="ts">
  import {nip19} from "nostr-tools"
  import Content from "src/partials/Content.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {getPubkeyHints, displayHandle, people} from "src/engine"

  export let pubkey

  const person = people.key(pubkey)
  const relays = getPubkeyHints.limit(3).getHints(pubkey, "write")
  const nprofile = nip19.nprofileEncode({pubkey, relays})
</script>

<Content>
  <h1 class="staatliches text-2xl">Details</h1>
  <CopyValue label="Link" value={nprofile} />
  <CopyValue label="Public Key" encode={nip19.npubEncode} value={pubkey} />
  {#if $person?.handle}
    {@const display = displayHandle($person.handle)}
    <CopyValue label="Nostr Address" value={display} />
    <Content size="inherit" gap="gap-2">
      <strong>Nostr Address Relays</strong>
      {#each $person.handle.profile.relays || [] as url}
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
