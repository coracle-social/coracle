<script>
  import {liveQuery} from 'dexie'
  import {without} from 'ramda'
  import {get} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {db, user} from "src/agent"
  import {modal, addRelay, removeRelay, settings} from "src/app"
  import defaults from "src/agent/defaults"

  let q = ""
  let search
  let relays = []

  $: relays = $user?.relays || defaults.relays

  fetch(get(settings).dufflepudUrl + '/relay').then(r => r.json()).then(({relays}) => {
    for (const url of relays) {
      db.relays.put({url})
    }
  })

  for (const url of defaults.relays) {
     db.relays.put({url})
  }

  const knownRelays = liveQuery(() => db.relays.toArray())

  $: search = fuzzy($knownRelays, {keys: ["name", "description", "url"]})

  const join = url => {
    relays = relays.concat(url)
    addRelay(url)

    document.querySelector('input').select()
  }

  const leave = url => {
    relays = without([url], relays)
    removeRelay(url)
  }
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
        {#if relays.includes(r.url)}
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
      {#each (search(q) || []).slice(0, 50) as r}
        {#if !relays.includes(r.url)}
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
      <small class="text-center">
        Showing {Math.min(($knownRelays || []).length, 50)} of {($knownRelays || []).length} known relays
      </small>
    </div>
  </div>
</div>
