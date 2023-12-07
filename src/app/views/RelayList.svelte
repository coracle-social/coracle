<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import MobileInset from "src/partials/MobileInset.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {router} from "src/app/router"
  import {relayPolicies} from "src/engine"

  const browse = () => router.at("relays/browse").open()

  document.title = "Relays"
</script>

<MobileInset class="flex flex-col gap-4">
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
</MobileInset>

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
