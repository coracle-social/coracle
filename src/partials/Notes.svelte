<script>
  import {prop, identity, concat, uniqBy, groupBy} from 'ramda'
  import {createMap} from 'hurdak/lib/hurdak'
  import {findReply, findRoot} from 'src/util/nostr'
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
    return await toThread(
      await relay.filterEvents(filter).limit(10).reverse().sortBy('created_at')
    )
  })
</script>

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
{/if}
