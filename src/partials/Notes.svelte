<script>
  import {sortBy, pluck, reject} from 'ramda'
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
  import {quantify} from 'hurdak/lib/hurdak'
  import {createScroller, now} from 'src/util/misc'
  import {findReply} from 'src/util/nostr'
  import Spinner from 'src/partials/Spinner.svelte'
  import Note from "src/partials/Note.svelte"
  import relay from 'src/relay'

  export let loadNotes
  export let queryNotes

  const notes = relay.lq(async () => {
    const notes = await queryNotes()
    const annotated = await relay.annotateChunk(notes)

    return sortBy(
      e => -pluck('created_at', e.replies).concat(e.created_at).reduce((a, b) => Math.max(a, b)),
      annotated
    )
  })

  let until = now()
  let newNotes = []
  let newNotesLength = 0

  $: newNotes = ($notes || []).filter(e => e.created_at > until)
  $: newNotesLength = reject(findReply, newNotes).length
  $: visibleNotes = ($notes || []).filter(e => e.created_at < until)

  onMount(() => {
    const scroller = createScroller(loadNotes)

    return scroller.stop
  })
</script>

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#if newNotesLength > 0}
  <div
    transition:slide
    class="mb-2 cursor-pointer text-center underline text-light"
    on:click={() => { until = now() }}>
    Load {quantify(newNotesLength, 'new note')}
  </div>
  {/if}
  {#each visibleNotes as n (n.id)}
    <li><Note note={n} depth={2} /></li>
  {/each}
</ul>

<Spinner />
