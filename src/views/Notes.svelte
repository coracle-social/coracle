<script>
  import {onDestroy} from 'svelte'
  import {prop, identity, concat, uniqBy, groupBy} from 'ramda'
  import {createMap} from 'hurdak/lib/hurdak'
  import {timedelta} from 'src/util/misc'
  import {findReply, findRoot} from 'src/util/nostr'
  import Spinner from 'src/partials/Spinner.svelte'
  import Note from "src/views/Note.svelte"
  import relay from 'src/relay'

  export let filter
  export let showParent = false
  export let shouldMuffle = false
  export let delta = timedelta(10, 'minutes')

  let notes

  onDestroy(relay.scroller(filter, delta, async chunk => {
    notes = relay.lq(async () => {
      const ancestorIds = concat(chunk.map(findRoot), chunk.map(findReply)).filter(identity)
      const ancestors = await relay.filterEvents({kinds: [1], ids: ancestorIds}).toArray()

      const allNotes = uniqBy(prop('id'), chunk.concat(ancestors))
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
  }))
</script>

{#if notes}
<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($notes || []) as n (n.id)}
    <li><Note interactive note={n} depth={2} {showParent} /></li>
  {/each}
</ul>
{/if}

<Spinner />
