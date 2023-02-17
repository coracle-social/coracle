<script lang="ts">
  import {onMount} from 'svelte'
  import {partition, last, propEq, always, mergeRight, uniqBy, sortBy, prop} from 'ramda'
  import {slide} from 'svelte/transition'
  import {quantify} from 'hurdak/lib/hurdak'
  import {createScroller, now, Cursor} from 'src/util/misc'
  import {Tags} from 'src/util/nostr'
  import Spinner from 'src/partials/Spinner.svelte'
  import Content from 'src/partials/Content.svelte'
  import Note from "src/partials/Note.svelte"
  import {user} from 'src/agent/user'
  import network from 'src/agent/network'
  import {modal} from "src/app/ui"
  import {mergeParents} from "src/app"

  export let filter
  export let relays = []
  export let shouldDisplay = always(true)

  let notes = []
  let notesBuffer = []

  const since = now()
  const maxNotes = 300
  const cursor = new Cursor()
  const muffle = Tags
    .wrap(($user?.muffle || []).filter(t => Math.random() > parseFloat(last(t))))
    .values().all()

  const processNewNotes = async newNotes => {
    // Remove people we're not interested in hearing about, sort by created date
    newNotes = newNotes.filter(e => !muffle.includes(e.pubkey))

    // Load parents before showing the notes so we have hierarchy
    const combined = uniqBy(
      prop('id'),
      newNotes
        .filter(propEq('kind', 1))
        .concat(await network.loadParents(newNotes))
        .map(mergeRight({replies: [], reactions: [], children: []}))
    )

    // Stream in additional data
    network.streamContext({
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
    notes = uniqBy(
      prop('id'),
      notesBuffer.filter(shouldDisplay).concat(notes).slice(0, maxNotes)
    )

    notesBuffer = []
  }

  const onChunk = async newNotes => {
    const chunk = sortBy(e => -e.created_at, await processNewNotes(newNotes))
    const [bottom, top] = partition(e => e.created_at < since, chunk)

    // Slice new notes in case someone leaves the tab open for a long time
    notes = uniqBy(prop('id'), notes.concat(bottom))
    notesBuffer = top.concat(notesBuffer).slice(0, maxNotes)

    // Check all notes every time to stay very conservative with moving the window
    cursor.onChunk(notes)
  }

  onMount(() => {
    const sub = network.listen(relays, {...filter, since}, onChunk)

    const scroller = createScroller(() => {
      if ($modal) {
        return
      }

      const {limit, until} = cursor

      console.log('here')

      return network.listenUntilEose(relays, {...filter, until, limit}, onChunk)
    })

    return () => {
      scroller.stop()
      sub.then(s => s?.unsub())
    }
  })
</script>

<Content size="inherit" class="pt-6">
  {#if notesBuffer.filter(shouldDisplay).length > 0}
  <button
    in:slide
    class="cursor-pointer text-center underline text-light"
    on:click={loadBufferedNotes}>
    Load {quantify(notesBuffer.filter(shouldDisplay).length, 'new note')}
  </button>
  {/if}

  <div>
    {#each notes as note (note.id)}
    <Note {note} {shouldDisplay} />
    {/each}
  </div>

  <Spinner />
</Content>
