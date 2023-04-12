<script lang="ts">
  import {onMount} from "svelte"
  import {partition, always, propEq, uniqBy, sortBy, prop} from "ramda"
  import {fly} from "svelte/transition"
  import {quantify} from "hurdak/lib/hurdak"
  import {createScroller, now, timedelta, Cursor} from "src/util/misc"
  import {asDisplayEvent, mergeFilter} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Spinner from "src/partials/Spinner.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Note from "src/app/shared/Note.svelte"
  import user from "src/agent/user"
  import network from "src/agent/network"
  import {mergeParents} from "src/app/state"

  export let filter
  export let relays = []
  export let delta = timedelta(6, "hours")
  export let shouldDisplay = always(true)
  export let parentsTimeout = 500

  let notes = []
  let notesBuffer = []
  let feedRelay = null
  let feedScroller = null

  // Add a short buffer so we can get the most possible results for recent notes
  const since = now()
  const maxNotes = 100
  const cursor = new Cursor({delta})
  const seen = new Set()

  const setFeedRelay = relay => {
    feedRelay = relay

    setTimeout(() => {
      feedScroller?.stop()
      feedScroller = !relay
        ? null
        : createScroller(loadMore, {
            element: document.querySelector(".modal-content"),
          })
    }, 300)
  }

  const loadBufferedNotes = () => {
    // Drop notes at the end if there are a lot
    notes = uniqBy(prop("id"), notesBuffer.concat(notes).slice(0, maxNotes))
    notesBuffer = []

    document.body.scrollIntoView({behavior: "smooth"})
  }

  const onChunk = async newNotes => {
    // Deduplicate and filter out stuff we don't want, apply user preferences
    const filtered = user.applyMutes(newNotes.filter(n => !seen.has(n.id) && shouldDisplay(n)))

    // Drop the oldest 20% of notes. We sometimes get pretty old stuff since we don't
    // use a since on our filter
    const pruned = cursor.prune(filtered)

    // Keep track of what we've seen
    for (const note of pruned) {
      seen.add(note.id)
    }

    // Load parents before showing the notes so we have hierarchy. Give it a short
    // timeout, since this is really just a nice-to-have
    const parents = await network.loadParents(filtered, {timeout: parentsTimeout})

    // Keep track of parents too
    for (const note of parents) {
      seen.add(note.id)
    }

    // Combine notes and parents into a single collection
    const combined = uniqBy(
      prop("id"),
      filtered.filter(propEq("kind", 1)).concat(parents).map(asDisplayEvent)
    )

    // Stream in additional data and merge it in
    network.streamContext({
      maxDepth: 2,
      notes: combined.filter(propEq("kind", 1)),
      onChunk: context => {
        context = user.applyMutes(context)

        notesBuffer = network.applyContext(notesBuffer, context)
        notes = network.applyContext(notes, context)
      },
    })

    // Show replies grouped by parent whenever possible
    const merged = sortBy(e => -e.created_at, mergeParents(combined))

    // Split into notes before and after we started loading
    const [bottom, top] = partition(e => e.created_at < since, merged)

    // Slice new notes in case someone leaves the tab open for a long time
    notesBuffer = top.concat(notesBuffer).slice(0, maxNotes)
    notes = uniqBy(prop("id"), notes.concat(bottom))
  }

  const loadMore = async () => {
    if ($modal) {
      return
    }

    // Wait for this page to load before trying again
    await network.load({
      relays: feedRelay ? [feedRelay] : relays,
      filter: mergeFilter(filter, cursor.getFilter()),
      onChunk,
    })

    // Update our cursor
    cursor.update(notes)
  }

  onMount(() => {
    const sub = network.listen({
      relays,
      filter: mergeFilter(filter, {since}),
      onChunk,
    })

    const scroller = createScroller(loadMore)

    return () => {
      scroller.stop()
      feedScroller?.stop()
      sub.then(s => s?.unsub())
    }
  })
</script>

<Content size="inherit" class="pt-6">
  {#if notesBuffer.length > 0}
    <div class="pointer-events-none fixed left-0 top-0 z-10 mt-20 flex w-full justify-center">
      <button
        in:fly={{y: 20}}
        class="pointer-events-auto cursor-pointer rounded-full border border-solid
               border-accent-light bg-accent py-2 px-4 text-center text-white
               shadow-lg transition-colors hover:bg-accent-light"
        on:click={loadBufferedNotes}>
        Load {quantify(notesBuffer.length, "new note")}
      </button>
    </div>
  {/if}

  <div class="flex flex-col gap-4">
    {#each notes as note (note.id)}
      <Note depth={2} {note} {feedRelay} {setFeedRelay} />
    {/each}
  </div>

  <Spinner />
</Content>

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} {notes} depth={2} />
  </Modal>
{/if}
