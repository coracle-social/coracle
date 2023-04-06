<script>
  import {sortBy, identity, uniq, pluck} from 'ramda'
  import {fly} from "svelte/transition"
  import Toggle from "src/partials/Toggle.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/partials/RelayCard.svelte"
  import user from "src/agent/user"
  import {muteRelays} from "src/app/ui"

  const {relays} = user
  const isMuted = url => $muteRelays.includes(url)
  const toggle = url => muteRelays.toggle(url)

  $: allUrls = sortBy(identity, uniq($muteRelays.concat(pluck('url', $relays))))
</script>

<div in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-server fa-lg" />
        <h2 class="staatliches text-2xl">Mute relays</h2>
      </div>
    </div>
    <div class="flex items-center gap-2 text-gray-4">
      <i class="fa fa-warning" /> Advanced Feature
    </div>
    <p>
      Select relays to temporarily mute. This is separate from your main relay selections,
      and is just to help you explore what different relays have to offer.
      Muted relays may sometimes still be used to load context for other notes.
    </p>
    {#if allUrls.length === 0}
      <div class="mt-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        No relays connected
      </div>
    {/if}
    <div class="grid grid-cols-1 gap-4">
      {#each allUrls as url}
        <RelayCard relay={{url}}>
          <div slot="controls" class="flex justify-between gap-2">
            <span>Mute this relay?</span>
            <Toggle value={isMuted(url)} on:change={() => toggle(url)} />
          </div>
        </RelayCard>
      {/each}
    </div>
  </Content>
</div>
