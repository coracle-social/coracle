<script>
  import {pluck} from 'ramda'
  import {noop, createMap} from 'hurdak/lib/hurdak'
  import {onMount} from 'svelte'
  import {get} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {fuzzy, poll} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/partials/RelayCard.svelte"
  import {lq, pool, db, user} from "src/agent"
  import {modal, settings} from "src/app"
  import defaults from "src/agent/defaults"

  let q = ""
  let search
  let status = {}
  let relays = []

  fetch(get(settings).dufflepudUrl + '/relay')
    .then(async res => {
      const json = await res.json()

      for (const url of json.relays) {
        db.table('relays').put({url})
      }
    }).catch(noop)

  for (const relay of defaults.relays) {
     db.table('relays').put(relay)
  }

  const knownRelays = lq(() => db.table('relays').toArray())

  $: {
    const joined = pluck('url', $user?.relays || [])
    const data = ($knownRelays || []).filter(r => !joined.includes(r.url))

    search = fuzzy(data, {keys: ["name", "description", "url"]})
  }

  onMount(() => {
    return poll(1000, async () => {
      const userRelays = $user?.relays || []
      const urls = pluck('url', userRelays)
      const relaysByUrl = createMap(
        'url',
        await db.table('relays').where('url').anyOf(urls).toArray()
      )

      relays = userRelays.map(relay => ({...relaysByUrl[relay.url], ...relay}))

      // Attempt to connect so we can show status
      relays.forEach(relay => pool.connect(relay.url))

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
  <div class="grid grid-cols-1 gap-4">
    {#each relays as relay, i (relay.url)}
      <RelayCard showControls {relay} {i} />
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
    {#each (search(q) || []).slice(0, 50) as relay, i (relay.url)}
    <RelayCard {relay} {i} />
    {/each}
    <small class="text-center">
      Showing {Math.min(($knownRelays || []).length - relays.length, 50)}
      of {($knownRelays || []).length - relays.length} known relays
    </small>
  </div>
</Content>
