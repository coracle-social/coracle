<script>
  import {prop, identity, concat, uniqBy, groupBy} from 'ramda'
  import {createMap} from 'hurdak/lib/hurdak'
  import {now, timedelta} from 'src/util/misc'
  import {findReply, findRoot} from 'src/util/nostr'
  import {fly} from 'svelte/transition'
  import {createScroller} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import Note from "src/views/Note.svelte"
  import relay from 'src/relay'

  export let filter
  export let shouldMuffle = false

  let limit = 10, init = now(), offset = 0, notes

  const onScroll = createScroller(async () => {
    limit += 10
    offset += 1

    const delta = timedelta(1, 'minutes')
    const since = init - delta * offset
    const until = init - delta * (offset - 1)

    await relay.pool.loadEvents({...filter, since, until})

    createNotesObservable()
  })

  const createNotesObservable = () => {
    notes = relay.lq(async () => {
      const notes = await relay.filterEvents(filter).limit(limit).reverse().sortBy('created_at')
      const ancestorIds = concat(notes.map(findRoot), notes.map(findReply)).filter(identity)
      const ancestors = await relay.filterEvents({kinds: [1], ids: ancestorIds}).toArray()

      const allNotes = uniqBy(prop('id'), notes.concat(ancestors))
      const notesById = createMap('id', allNotes)
      const notesByRoot = groupBy(
        n => {
          const rootId = findRoot(n)
          const parentId = findReply(n)

          // Actually dereference the notes in case we weren't able to retrieve them
          if (notesById[rootId]) {
            return rootId
          }

          if (notesById[parentId]) {
            return parentId
          }

          return n.id
        },
        allNotes
      )

      return await Promise.all(Object.keys(notesByRoot).map(relay.findNote))
    })
  }

  createNotesObservable()
</script>

<svelte:window on:scroll={onScroll} />

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($notes || []) as n (n.id)}
    <li><Note interactive note={n} depth={2} /></li>
  {/each}
</ul>

{#if $notes?.length === 0}
<div in:fly={{y: 20}} class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    No notes found.
  </div>
</div>
{:else}
<Spinner />
{/if}
