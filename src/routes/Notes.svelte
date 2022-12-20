<script>
  import {onMount, onDestroy} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {findReply} from 'src/util/nostr'
  import Anchor from "src/partials/Anchor.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Notes from "src/views/Notes.svelte"
  import {now, timedelta} from 'src/util/misc'
  import relay, {network, connections} from 'src/relay'

  export let activeTab

  let sub
  let delta = timedelta(1, 'minutes')
  let since = now() - delta

  onMount(async () => {
    sub = await subscribe(now())
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const setActiveTab = tab => navigate(`/notes/${tab}`)

  const subscribe = until =>
    relay.pool.listenForEvents(
      'routes/Notes',
      [{kinds: [1, 5, 7], since, until}],
      async e => {
        if (e.kind === 1) {
          const filter = await relay.buildNoteContextFilter(e, {since})

          await relay.pool.loadEvents(filter)
        }

        if (e.kind === 7) {
          const replyId = findReply(e)

          if (replyId && !await relay.db.events.get(replyId)) {
            await relay.pool.loadEvents({kinds: [1], ids: [replyId]})
          }

        }
      }
    )

  const loadNetworkNotes = async limit => {
    const filter = {kinds: [1], authors: $network}
    const notes = await relay.filterEvents(filter).reverse().sortBy('created_at')

    return relay.annotateChunk(notes.slice(0, limit))
  }

  const loadGlobalNotes = async limit => {
    const filter = {kinds: [1], since}
    const notes = await relay.filterEvents(filter).reverse().sortBy('created_at')

    if (notes.length < limit) {
      since -= delta

      sub = await subscribe(since + delta)
    }

    return relay.annotateChunk(notes.slice(0, limit))
  }
</script>

{#if $connections.length === 0}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You aren't yet connected to any relays. Please click <Anchor href="/relays"
      >here</Anchor
    > to get started.
  </div>
</div>
{:else}
<Tabs tabs={['network', 'global']} {activeTab} {setActiveTab} />
{#if activeTab === 'network'}
<Notes shouldMuffle loadNotes={loadNetworkNotes} />
{:else}
<Notes shouldMuffle loadNotes={loadGlobalNotes} />
{/if}
<div class="fixed bottom-0 right-0 p-8">
  <a
    href="/notes/new"
    class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
            items-center border border-dark shadow-2xl cursor-pointer">
    <span class="fa-sold fa-plus fa-2xl" />
  </a>
</div>
{/if}

