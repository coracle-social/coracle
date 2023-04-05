<script lang="ts">
  import {nip05, nip19} from "nostr-tools"
  import {toast} from "src/app/ui"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/views/relays/RelayCard.svelte"
  import {copyToClipboard} from "src/util/html"
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"

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

  const copy = (label, text) => {
    copyToClipboard(text)
    toast.show("info", `${label} copied to clipboard!`)
  }
</script>

<div in:fly={{y: 20}}>
  <Content>
    <h1 class="staatliches text-2xl">Profile Details</h1>
    <div>
      <div class="mb-1 text-lg">Public Key (Hex)</div>
      <div class="font-mono text-sm">
        <button
          class="fa-solid fa-copy cursor-pointer"
          on:click={() => copy("Public key", person.pubkey)} />
        {person.pubkey}
      </div>
    </div>
    <div>
      <div class="mb-1 text-lg">Public Key (npub)</div>
      <div class="font-mono text-sm">
        {#if npub}
          <button
            class="fa-solid fa-copy cursor-pointer"
            on:click={() => copy("Public key", npub)} />
        {/if}
        {npub}
      </div>
    </div>
    {#if nprofile}
      <div class="flex flex-col gap-2">
        <div class="text-lg">Profile Link</div>
        <div class="break-all font-mono text-sm">
          <button
            class="fa-solid fa-copy inline cursor-pointer"
            on:click={() => copy("Profile", nprofile)} />
          {nprofile}
        </div>
      </div>
    {/if}

    <h1 class="staatliches mt-4 text-2xl">NIP05</h1>

    {#if loaded && person.verified_as}
      <div>
        <div class="mb-1 text-lg">NIP05 Identifier</div>
        <div class="font-mono text-sm">
          {#if person.verified_as}
            <button
              class="fa-solid fa-copy inline cursor-pointer"
              on:click={() => copy("NIP05 Identifier", person.verified_as)} />
          {/if}
          {person.verified_as || "?"}
        </div>
      </div>
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
