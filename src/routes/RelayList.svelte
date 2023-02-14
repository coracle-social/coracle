<script>
  import {pluck, objOf, fromPairs} from 'ramda'
  import {noop, createMap} from 'hurdak/lib/hurdak'
  import {onMount} from 'svelte'
  import {get} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {fuzzy, poll} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/partials/RelayCard.svelte"
  import {user} from "src/agent/helpers"
  import database from 'src/agent/database'
  import pool from 'src/agent/pool'
  import {modal, settings} from "src/app"
  import defaults from "src/agent/defaults"

  let q = ""
  let search
  let status = {}
  let relays = []

  fetch(get(settings).dufflepudUrl + '/relay')
    .then(async res => {
      const json = await res.json()

      database.relays.bulkPatch(createMap('url', json.relays.map(objOf('url'))))
    }).catch(noop)

  database.relays.bulkPatch(createMap('url', defaults.relays))

  const knownRelays = database.watch('relays', relays => relays.all())

  $: {
    const joined = pluck('url', $user?.relays || [])
    const data = ($knownRelays || []).filter(r => !joined.includes(r.url))

    search = fuzzy(data, {keys: ["name", "description", "url"]})
  }

  onMount(() => {
    return poll(1000, async () => {
      relays = ($user?.relays || [])
        .map(relay => ({...database.relays.get(relay.url), ...relay}))

      // Attempt to connect so we can show status
      relays.forEach(relay => pool.connect(relay.url))

      status = fromPairs(
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
    {#each relays as relay (relay.url)}
      <RelayCard showControls {relay} />
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
    {#each (search(q) || []).slice(0, 50) as relay (relay.url)}
    <RelayCard {relay} />
    {/each}
    <small class="text-center">
      Showing {Math.min(($knownRelays || []).length - relays.length, 50)}
      of {($knownRelays || []).length - relays.length} known relays
    </small>
  </div>
</Content>
