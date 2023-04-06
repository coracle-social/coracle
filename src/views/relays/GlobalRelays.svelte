<script>
  import {without, pluck} from 'ramda'
  import {fly} from "svelte/transition"
  import Toggle from "src/partials/Toggle.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/partials/RelayCard.svelte"
  import user from "src/agent/user"
  import {globalRelays} from "src/app/ui"

  const {relays} = user
  const isSelected = url => $globalRelays.length === 0 || $globalRelays.includes(url)
  const toggle = url =>
    $globalRelays.length === 0
      ? globalRelays.set(without([url], pluck('url', $relays)))
      : globalRelays.toggle(url)
</script>

<div in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-server fa-lg" />
        <h2 class="staatliches text-2xl">Explore relays</h2>
      </div>
    </div>
    <div class="flex items-center gap-2 text-gray-4">
      <i class="fa fa-warning" /> Advanced Feature
    </div>
    <p>
      Select which of your relays to use to request feeds. This is separate from your main
      relay selections, and is just to help you explore what different relays have to offer.
      Some notes from other relays will be included if required for context.
    </p>
    {#if $relays.length === 0}
      <div class="mt-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        No relays connected
      </div>
    {/if}
    <div class="grid grid-cols-1 gap-4">
      {#each $relays as relay (relay.url)}
        <RelayCard {relay}>
          <div slot="controls" class="flex justify-between gap-2">
            <span>Include in feeds?</span>
            <Toggle value={isSelected(relay.url)} on:change={() => toggle(relay.url)} />
          </div>
        </RelayCard>
      {/each}
    </div>
  </Content>
</div>
