<script>
  import {liveQuery} from 'dexie'
  import {prop, identity, concat, uniqBy, groupBy} from 'ramda'
  import {createMap} from 'hurdak/lib/hurdak'
  import {findReply, findRoot} from 'src/nostr/tags'
  import {fly} from 'svelte/transition'
  import Note from "src/partials/Note.svelte"
  import relay from 'src/relay'

  export let filter
  export let shouldMuffle = false

  const toThread = async notes => {
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

    return Object.keys(notesByRoot).map(id => notesById[id])
  }

  const notes = relay.lq(async () => {
    let data = relay.filterEvents(filter).limit(10)

    if (shouldMuffle) {
      data = data
    }

    return await toThread(await data.reverse().sortBy('created_at'))
  })
</script>

<!-- <svelte:window on:scroll={scroller?.start} /> -->

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($notes || []) as n (n.id)}
    <li><Note interactive note={n} depth={2} /></li>
  {:else}
  <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
  {/each}
</ul>
