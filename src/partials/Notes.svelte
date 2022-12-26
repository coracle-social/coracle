<script>
  import {sortBy, uniqBy, reject, prop} from 'ramda'
  import {onDestroy} from 'svelte'
  import {slide} from 'svelte/transition'
  import {quantify} from 'hurdak/lib/hurdak'
  import {createScroller} from 'src/util/misc'
  import {findReply} from 'src/util/nostr'
  import Spinner from 'src/partials/Spinner.svelte'
  import Note from "src/partials/Note.svelte"
  import relay from 'src/relay'

  export let loadNotes
  export const addNewNotes = xs => {
    newNotes = newNotes.concat(xs)
  }

  let notes = []
  let newNotes = []
  let newNotesLength = 0

  $: newNotesLength = reject(findReply, newNotes).length

  const scroller = createScroller(async () => {
    addNotes(await loadNotes())
  })

  const addNotes = async xs => {
    const chunk = await relay.annotateChunk(xs)

    notes = sortBy(e => -e.created_at, uniqBy(prop('id'), notes.concat(chunk)))
  }

  onDestroy(() => {
    scroller.stop()
  })
</script>

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#if newNotesLength > 0}
  <div
    transition:slide
    class="mb-2 cursor-pointer text-center underline text-light"
    on:click={() => { addNotes(newNotes); newNotes = [] }}>
    Load {quantify(newNotesLength, 'new note')}
  </div>
  {/if}
  {#each notes as n (n.id)}
    <li><Note note={n} depth={2} /></li>
  {/each}
</ul>

<Spinner />
