<script>
  import {onMount} from 'svelte'
  import {uniqBy, prop} from 'ramda'
  import {slide} from 'svelte/transition'
  import {quantify} from 'hurdak/lib/hurdak'
  import {createScroller} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import Content from 'src/partials/Content.svelte'
  import Note from "src/partials/Note.svelte"
  import {modal} from "src/app"

  export let loadNotes
  export let listenForNotes

  let depth = 2
  let notes = []
  let newNotes = []

  // Make max notes sort of random so people don't know they're missing out
  let maxNotes = 200 + Math.round(Math.random() * 100)

  const showNewNotes = () => {
    // Drop notes at the end if there are a lot
    notes = uniqBy(prop('id'), newNotes.concat(notes).slice(0, maxNotes))
    newNotes = []
  }

  onMount(() => {
    const sub = listenForNotes(events => {
      // Slice new notes so if someone leaves the tab open for a long time we don't get a bazillion
      newNotes = events.concat(newNotes).slice(0, maxNotes)
    })

    const scroller = createScroller(async () => {
      if ($modal) {
        return
      }

      // Drop notes at the top if there are a lot
      notes = uniqBy(prop('id'), notes.concat(await loadNotes()).slice(-maxNotes))
    })

    return async () => {
      const {unsub} = await sub

      scroller.stop()
      unsub()
    }
  })
</script>

<Content>
  {#if newNotes.length > 0}
  <div
    in:slide
    class="mb-2 cursor-pointer text-center underline text-light"
    on:click={showNewNotes}>
    Load {quantify(newNotes.length, 'new note')}
  </div>
  {/if}
  {#each notes as note (note.id)}
  <Note {note} {depth} />
  {/each}
</Content>

<Spinner />
