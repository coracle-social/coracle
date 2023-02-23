<script>
  import {fly} from 'svelte/transition'
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import RelaySearch from "src/views/relays/RelaySearch.svelte"
  import RelayCard from "src/views/relays/RelayCard.svelte"
  import user from "src/agent/user"
  import {modal} from "src/app/ui"

  const {relays} = user
</script>

<div in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-between mt-10">
      <div class="flex gap-2 items-center">
        <i class="fa fa-server fa-lg" />
        <h2 class="staatliches text-2xl">Your relays</h2>
      </div>
      <Anchor type="button-accent" on:click={() => modal.set({type: 'relay/add'})}>
        <i class="fa-solid fa-plus" /> Add Relay
      </Anchor>
    </div>
    <p>
      Relays are hubs for your content and connections. At least one is required to
      interact with the network, but you can join as many as you like.
    </p>
    {#if $relays.length === 0}
    <div class="text-center mt-8 flex gap-2 justify-center items-center">
      <i class="fa fa-triangle-exclamation" />
      No relays connected
    </div>
    {/if}
    <div class="grid grid-cols-1 gap-4">
      {#each $relays as relay (relay.url)}
        <RelayCard showControls {relay} />
      {/each}
    </div>
    <div class="flex flex-col gap-6" in:fly={{y: 20, delay: 1000}}>
      <div class="pt-2 mb-2 border-b border-solid border-medium" />
      <div class="flex gap-2 items-center">
        <i class="fa fa-earth-asia fa-lg" />
        <h2 class="staatliches text-2xl">Other relays</h2>
      </div>
      <p>
        Coracle automatically discovers relays as you browse the network. Adding more relays
        will generally make things quicker to load, at the expense of higher data usage.
      </p>
      <RelaySearch />
    </div>
  </Content>
</div>
