<script>
  import {onDestroy} from 'svelte'
  import {prop, identity, concat, uniqBy, groupBy} from 'ramda'
  import {createMap} from 'hurdak/lib/hurdak'
  import {now, timedelta} from 'src/util/misc'
  import {findReply, findRoot} from 'src/util/nostr'
  import {createScroller} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import Note from "src/views/Note.svelte"
  import relay from 'src/relay'

  export let filter
  export let showParent = false
  export let shouldMuffle = false
  export let delta = timedelta(10, 'minutes')

  let since = now() - delta, until = now(), notes

  const unsub = createScroller(async () => {
    since -= delta
    until -= delta

    // Load our events, but don't wait for them because we probably have them in dexie
    await relay.ensureContext(
      await relay.pool.loadEvents({...filter, since, until})
    )

    const notes = await relay.filterEvents({...filter, since}).reverse().sortBy('created_at')
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

  onDestroy(unsub)
</script>

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($notes || []) as n (n.id)}
    <li><Note interactive note={n} depth={2} {showParent} /></li>
  {/each}
</ul>

<Spinner />
