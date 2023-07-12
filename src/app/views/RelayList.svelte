<script>
  import {fly} from "src/util/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {routing, user} from "src/app/engine"
  import {watch} from "src/util/loki"
  import {modal} from "src/partials/state"

  const relays = watch(routing.policies, () => user.getRelays())

  document.title = "Relays"
</script>

<div in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-server fa-lg" />
        <h2 class="staatliches text-2xl">Your relays</h2>
      </div>
      <Anchor theme="button-accent" on:click={() => modal.push({type: "relay/browse"})}>
        <i class="fa-solid fa-compass" /> Browse Relays
      </Anchor>
    </div>
    <p>
      Relays are hubs for your content and connections. At least one is required to interact with
      the network, but you can join as many as you like.
    </p>
    {#if $relays.length === 0}
      <div class="mt-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        No relays connected
      </div>
    {/if}
    <div class="grid grid-cols-1 gap-4">
      {#each $relays as relay (relay.url)}
        <RelayCard showStatus showControls {relay} />
      {/each}
    </div>
  </Content>
</div>
