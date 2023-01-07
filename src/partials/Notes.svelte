<script>
  import {liveQuery} from 'dexie'
  import {sortBy, pluck, reject} from 'ramda'
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
  import {quantify} from 'hurdak/lib/hurdak'
  import {createScroller, sleep, now} from 'src/util/misc'
  import {findReply} from 'src/util/nostr'
  import Spinner from 'src/partials/Spinner.svelte'
  import Note from "src/partials/Note.svelte"
  import query from 'src/app/query'

  export let loadNotes
  export let queryNotes

  const notes = liveQuery(async () => {
    // Hacky way to wait for the loader to adjust the cursor so we have a nonzero duration
    await sleep(100)

    return sortBy(
      e => -pluck('created_at', e.replies).concat(e.created_at).reduce((a, b) => Math.max(a, b)),
      await query.annotateChunk(await queryNotes())
    )
  })

  let depth = 2
  let until = now()
  let newNotes = []
  let newNotesLength = 0

  $: newNotes = ($notes || []).filter(e => e.created_at > until)
  $: newNotesLength = reject(findReply, newNotes).length
  $: visibleNotes = ($notes || []).filter(e => e.created_at <= until)

  onMount(() => {
    const scroller = createScroller(loadNotes)

    return scroller.stop
  })
</script>

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#if newNotesLength > 0}
  <div
    in:slide
    class="mb-2 cursor-pointer text-center underline text-light"
    on:click={() => { until = now() }}>
    Load {quantify(newNotesLength, 'new note')}
  </div>
  {/if}
  {#each visibleNotes as note (note.id)}
    <li><Note {until} {note} {depth} /></li>
  {/each}
</ul>

<Spinner />
