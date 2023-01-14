<script>
  import {liveQuery} from 'dexie'
  import {whereEq, find, last, reject} from 'ramda'
  import {get} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import {db, user} from "src/agent"
  import {modal, addRelay, removeRelay, setRelayWriteCondition, settings} from "src/app"
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

  for (const relay of defaults.relays) {
     db.relays.put(relay)
  }

  const knownRelays = liveQuery(() => db.relays.toArray())

  $: search = fuzzy($knownRelays, {keys: ["name", "description", "url"]})

  const join = url => {
    relays = relays.concat({url, write: "!"})
    addRelay(url)

    document.querySelector('input').select()
  }

  const leave = url => {
    relays = reject(whereEq({url}), relays)
    removeRelay(url)
  }
</script>

<div class="flex flex-col gap-6 m-auto max-w-2xl py-12">
  <div class="flex justify-between">
    <div class="flex gap-2 items-center">
      <i class="fa fa-server fa-lg" />
      <h2 class="staatliches text-2xl">Your relays</h2>
    </div>
    <Anchor type="button" on:click={() => modal.set({form: 'relay', url: q})}>
      <i class="fa-solid fa-plus" /> Add Relay
    </Anchor>
  </div>
  <p>
    Relays are hubs for your content and connections. At least one is required to
    interact with the network, but you can join as many as you like.
  </p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each relays as {url, write}, i}
      <div class="rounded border border-solid border-medium bg-dark shadow" in:fly={{y: 20, delay: i * 100}}>
        <div class="flex flex-col gap-2 py-3 px-6">
          <div class="flex gap-2 items-center justify-between">
            <strong class="flex gap-2 items-center">
              <i class={url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
              {last(url.split('://'))}
            </strong>
            <i class="fa fa-times cursor-pointer" on:click={() => leave(url)}/>
          </div>
          <p class="text-light">placeholder for description</p>
        </div>
        <div class="border-b border-solid border-medium" />
        <div class="flex justify-between gap-2 py-3 px-6">
          <span>Publish to this relay?</span>
          <Toggle
            value={write !== "!"}
            on:change={() => setRelayWriteCondition(url, write === "!" ? "" : "!")} />
        </div>
      </div>
    {/each}
  </div>
  {#if ($knownRelays || []).length > 0}
  <div class="pt-2 mb-2 border-b border-solid border-medium" />
  <div class="flex gap-2 items-center">
    <i class="fa fa-globe fa-lg" />
    <h2 class="staatliches text-2xl">Other relays</h2>
  </div>
  <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {/if}
  {#each (search(q) || []).slice(0, 50) as {url, name, description}}
    {#if !find(whereEq({url}), relays)}
    <div class="flex gap-2 justify-between">
      <div>
        <strong>{name || url}</strong>
        <p class="text-light">{description || ''}</p>
      </div>
      <a class="underline cursor-pointer" on:click={() => join(url)}>
        Join
      </a>
    </div>
    {/if}
  {/each}
  <small class="text-center">
    Showing {Math.min(($knownRelays || []).length - relays.length, 50)}
    of {($knownRelays || []).length - relays.length} known relays
  </small>
</div>
