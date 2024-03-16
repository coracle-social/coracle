<script lang="ts">
  import {comparator, pluck} from "ramda"
  import {shuffle, displayList} from "hurdak"
  import {pushToKey} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {router} from "src/app/router"
  import {
    follows,
    derivePerson,
    personHasName,
    displayPubkey,
    relayPolicies,
    getPubkeyRelayUrls,
  } from "src/engine"

  const browse = () => router.at("relays/browse").open()

  const pubkeysByUrl: Record<string, string[]> = {}
  const ownRelays = new Set(pluck("url", $relayPolicies))

  for (const pubkey of $follows) {
    if (!personHasName(derivePerson(pubkey).get())) {
      continue
    }

    for (const url of getPubkeyRelayUrls(pubkey, "write")) {
      if (!ownRelays.has(url)) {
        pushToKey(pubkeysByUrl, url, pubkey)
      }
    }
  }

  const otherRelays = Object.entries(pubkeysByUrl)
    .map(([url, pubkeys]) => ({url, pubkeys}))
    .sort(comparator((a, b) => a.pubkeys.length > b.pubkeys.length))

  // Drop the top 10 most popular relays to avoid network centralization
  const offset = Math.min(10, Math.max(0, otherRelays.length - 10))

  document.title = "Relays"
</script>

<div class="flex justify-between">
  <div class="flex items-center gap-2">
    <i class="fa fa-server fa-lg" />
    <h2 class="staatliches text-2xl">Your relays</h2>
  </div>
  <Anchor button accent on:click={browse}>
    <i class="fa-solid fa-compass" /> Browse Relays
  </Anchor>
</div>
<p>
  Relays are hubs for your content and connections. At least one is required to interact with the
  network, but you can join as many as you like.
</p>

{#if $relayPolicies.length === 0}
  <div class="mt-8 flex items-center justify-center gap-2 text-center">
    <i class="fa fa-triangle-exclamation" />
    No relays connected
  </div>
{/if}
<div class="grid grid-cols-1 gap-4">
  {#each $relayPolicies as policy (policy.url)}
    <RelayCard showStatus showControls relay={policy} />
  {/each}
</div>

{#if otherRelays.length > 0}
  <div class="flex items-center gap-2">
    <i class="fa fa-circle-nodes fa-lg" />
    <h2 class="staatliches text-2xl">Other relays</h2>
  </div>
  <p>
    Below are relays used by people in your network. Adding these may improve your ability to load
    profiles and content.
  </p>
  <div class="grid grid-cols-1 gap-4">
    {#each otherRelays.slice(offset, offset + 20) as { url, pubkeys } (url)}
      {@const pubkeyDisplay = displayList(shuffle(pubkeys).map(displayPubkey))}
      <RelayCard relay={{url, description: `Used by ${pubkeyDisplay}`}} />
    {/each}
  </div>
{/if}
