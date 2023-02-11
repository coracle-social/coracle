<script lang="ts">
  import {onMount} from 'svelte'
  import {mergeRight, uniqBy, sortBy, prop} from 'ramda'
  import {slide} from 'svelte/transition'
  import {quantify} from 'hurdak/lib/hurdak'
  import {createScroller, now, Cursor} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import Content from 'src/partials/Content.svelte'
  import Note from "src/partials/Note.svelte"
  import {getMuffle} from 'src/agent/helpers'
  import network from 'src/agent/network'
  import {modal, mergeParents} from "src/app"

  export let relays
  export let filter

  let notes = []
  let notesBuffer = []

  const maxNotes = 300
  const muffle = getMuffle()
  const cursor = new Cursor()

  const processNewNotes = async newNotes => {
    // Remove people we're not interested in hearing about, sort by created date
    newNotes = newNotes.filter(e => !muffle.includes(e.pubkey))

    // Load parents before showing the notes so we have hierarchy
    const combined = uniqBy(
      prop('id'),
      newNotes
        .concat(await network.loadParents(relays, newNotes))
        .map(mergeRight({replies: [], reactions: [], children: []}))
    )

    // Stream in additional data
    network.streamContext({
      relays,
      notes: combined,
      updateNotes: cb => {
        notes = cb(notes)
      },
    })

    // Show replies grouped by parent whenever possible
    return mergeParents(combined)
  }

  const loadBufferedNotes = () => {
    // Drop notes at the end if there are a lot
    notes = uniqBy(prop('id'), notesBuffer.splice(0).concat(notes).slice(0, maxNotes))
  }

  onMount(() => {
    const sub = network.listen(
      relays,
      {...filter, since: now()},
      async newNotes => {
        const chunk = await processNewNotes(newNotes)

        // Slice new notes in case someone leaves the tab open for a long time
        notesBuffer = chunk.concat(notesBuffer).slice(0, maxNotes)
      }
    )

    const scroller = createScroller(async () => {
      if ($modal) {
        return
      }

      const {limit, until} = cursor

      return network.listenUntilEose(
        relays,
        {...filter, limit, until},
        async newNotes => {
          cursor.onChunk(newNotes)

          const chunk = await processNewNotes(newNotes)

          notes = sortBy(e => -e.created_at, uniqBy(prop('id'), notes.concat(chunk)))
        }
      )
    })

    return async () => {
      const {unsub} = await sub

      scroller.stop()
      unsub()
    }
  })
</script>

<Content size="inherit" class="pt-6">
  {#if notesBuffer.length > 0}
  <button
    in:slide
    class="cursor-pointer text-center underline text-light"
    on:click={loadBufferedNotes}>
    Load {quantify(notesBuffer.length, 'new note')}
  </button>
  {/if}

  <div>
    {#each notes as note (note.id)}
    <Note {note} />
    {/each}
  </div>

  <Spinner />
</Content>
