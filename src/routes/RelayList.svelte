<script>
  import {liveQuery} from 'dexie'
  import {whereEq, find, last} from 'ramda'
  import {noop} from 'hurdak/lib/hurdak'
  import {onMount} from 'svelte'
  import {get} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {fuzzy, poll} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Content from "src/partials/Content.svelte"
  import {pool, db, user, ready} from "src/agent"
  import {modal, addRelay, removeRelay, setRelayWriteCondition, settings} from "src/app"
  import defaults from "src/agent/defaults"

  let q = ""
  let search
  let status = {}
  let relays = []

  fetch(get(settings).dufflepudUrl + '/relay')
    .then(async res => {
      const {relays} = await res.json()

      for (const url of relays) {
        db.table('relays').put({url})
      }
    }).catch(noop)

  for (const relay of defaults.relays) {
     db.table('relays').put(relay)
  }

  const knownRelays = liveQuery(() => db.table('relays').toArray())

  $: search = fuzzy($knownRelays, {keys: ["name", "description", "url"]})

  const join = async url => {
    await addRelay({url})
  }

  const leave = async url => {
    await removeRelay(url)
  }

  onMount(() => {
    // Attempt to connect so we can show status
    relays.forEach(relay => pool.connect(relay.url))

    return poll(300, () => {
      if ($ready) {
        relays = $user?.relays || []
      }

      status = Object.fromEntries(
        pool.getConnections().map(({url, status, stats}) => {
          // Be more strict here than with alerts
          if (status === 'ready' && stats.timer / stats.count > 1000) {
            status = 'slow'
          }

          return [url, status]
        })
      )
    })
  })
</script>

<Content>
  <div class="flex justify-between">
    <div class="flex gap-2 items-center">
      <i class="fa fa-server fa-lg" />
      <h2 class="staatliches text-2xl">Your relays</h2>
    </div>
    <Anchor type="button" on:click={() => modal.set({type: 'relay/add', url: q})}>
      <i class="fa-solid fa-plus" /> Add Relay
    </Anchor>
  </div>
  <p>
    Relays are hubs for your content and connections. At least one is required to
    interact with the network, but you can join as many as you like.
  </p>
  {#if relays.length === 0}
  <div class="text-center">No relays connected</div>
  {/if}
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each relays as {url, write}, i (url)}
      <div class="rounded border border-solid border-medium bg-dark shadow" in:fly={{y: 20, delay: i * 100}}>
        <div class="flex flex-col gap-2 py-3 px-6">
          <div class="flex gap-2 items-center justify-between">
            <strong class="flex gap-2 items-center">
              <i class={url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
              {last(url.split('://'))}
            </strong>
            <button class="fa fa-times cursor-pointer" on:click={() => leave(url)} />
          </div>
          <p class="text-light">
            {#if status[url] === 'error'}
            <div class="flex gap-2 items-center">
              <span class="inline-block w-2 h-2 rounded bg-danger" /> Not connected
            </div>
            {:else if status[url] === 'pending'}
            <div class="flex gap-2 items-center">
              <span class="inline-block w-2 h-2 rounded bg-warning" /> Trying to connect
            </div>
            {:else if status[url] === 'slow'}
            <div class="flex gap-2 items-center">
              <span class="inline-block w-2 h-2 rounded bg-warning" /> Slow connection
            </div>
            {:else if status[url] === 'ready'}
            <div class="flex gap-2 items-center">
              <span class="inline-block w-2 h-2 rounded bg-success" /> Connected
            </div>
            {:else}
            <div class="flex gap-2 items-center">
              <span class="inline-block w-2 h-2 rounded bg-medium" /> Waiting to reconnect
            </div>
            {/if}
          </p>
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
  <div class="flex flex-col gap-6" in:fly={{y: 20, delay: 1000}}>
    {#if ($knownRelays || []).length > 0}
    <div class="pt-2 mb-2 border-b border-solid border-medium" />
    <div class="flex gap-2 items-center">
      <i class="fa fa-globe fa-lg" />
      <h2 class="staatliches text-2xl">Other relays</h2>
    </div>
    <p>
      Coracle automatically discovers relays as you browse the network. Adding more relays
      will generally make things quicker to load, at the expense of higher data usage.
    </p>
    <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
      <i slot="before" class="fa-solid fa-search" />
    </Input>
    {/if}
    {#each (search(q) || []).slice(0, 50) as {url, name, description} (url)}
      {#if !find(whereEq({url}), relays)}
      <div class="flex gap-2 justify-between">
        <div>
          <strong>{name || url}</strong>
          <p class="text-light">{description || ''}</p>
        </div>
        <button class="underline cursor-pointer" on:click={() => join(url)}>
          Join
        </button>
      </div>
      {/if}
    {/each}
    <small class="text-center">
      Showing {Math.min(($knownRelays || []).length - relays.length, 50)}
      of {($knownRelays || []).length - relays.length} known relays
    </small>
  </div>
</Content>
