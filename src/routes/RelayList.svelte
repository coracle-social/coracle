<script>
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {modal} from "src/state/app"
  import relay, {connections} from 'src/relay'

  let q = ""
  let search

  const defaultRelays = [
    "wss://nostr.zebedee.cloud",
    "wss://nostr-pub.wellorder.net",
    "wss://relay.damus.io",
    "wss://relay.grunch.dev",
    "wss://nostr.sandwich.farm",
    "wss://relay.nostr.ch",
    "wss://nostr-relay.wlvs.space",
  ]

  for (const url of defaultRelays) {
    relay.db.relays.put({url})
  }

  const knownRelays = relay.lq(() => relay.db.relays.toArray())

  $: search = fuzzy($knownRelays, {keys: ["name", "description", "url"]})

  const join = url => {
    relay.addRelay(url)

    document.querySelector('input').select()
  }

  const leave = url => relay.removeRelay(url)
</script>

<div class="flex justify-center py-8 px-4" in:fly={{y: 20}}>
  <div class="flex flex-col gap-8 max-w-2xl w-full">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Get Connected</h1>
      <p>
        Relays are hubs for your content and connections. At least one is required to
        interact with the network, but you can join as many as you like.
      </p>
    </div>
    <div class="flex flex-col gap-6 overflow-auto flex-grow -mx-6 px-6">
      <h2 class="staatliches text-2xl">Your relays</h2>
      {#each ($knownRelays || []) as r}
        {#if $connections.includes(r.url)}
        <div class="flex gap-2 justify-between">
          <div>
            <strong>{r.name || r.url}</strong>
            <p class="text-light">{r.description || ''}</p>
          </div>
          <a class="underline cursor-pointer" on:click={() => leave(r.url)}>
            Leave
          </a>
        </div>
        {/if}
      {/each}
      {#if ($knownRelays || []).length > 0}
      <div class="pt-2 mb-2 border-b border-solid border-medium" />
      <h2 class="staatliches text-2xl">Other relays</h2>
      <div class="flex gap-4 items-center">
        <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
          <i slot="before" class="fa-solid fa-search" />
        </Input>
        <Anchor type="button" on:click={() => modal.set({form: 'relay', url: q})}>
          <i class="fa-solid fa-plus" /> Add Relay
        </Anchor>
      </div>
      {/if}
      {#each (search(q) || []).slice(0, 10) as r}
        {#if !$connections.includes(r.url)}
        <div class="flex gap-2 justify-between">
          <div>
            <strong>{r.name || r.url}</strong>
            <p class="text-light">{r.description || ''}</p>
          </div>
          <a class="underline cursor-pointer" on:click={() => join(r.url)}>
            Join
          </a>
        </div>
        {/if}
      {/each}
    </div>
  </div>
</div>
