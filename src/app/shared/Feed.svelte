<script lang="ts">
  import type {DynamicFilter} from "src/util/types"
  import {onMount, onDestroy} from "svelte"
  import {debounce} from "throttle-debounce"
  import {last, equals, partition, always, uniqBy, sortBy, prop} from "ramda"
  import {fly} from "src/util/transition"
  import {quantify} from "hurdak/lib/hurdak"
  import {fuzzy, batch, createScroller, now, timedelta} from "src/util/misc"
  import {asDisplayEvent, noteKinds, findReplyId} from "src/util/nostr"
  import Spinner from "src/partials/Spinner.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {user, routing, network} from "src/app/system"
  import legacyNetwork from "src/agent/network"
  import {mergeParents, compileFilter} from "src/app/state"

  export let relays = null
  export let filter = {} as DynamicFilter
  export let delta = timedelta(6, "hours")
  export let shouldDisplay = always(true)
  export let parentsTimeout = 500
  export let invertColors = false
  export let hideControls = false
  export let onEvent = null

  let unsubscribe, scroller, cursor
  let key = Math.random()
  let search = ""
  let notes = []
  let notesBuffer = []
  let feedRelay = null
  let feedScroller = null

  $: searchNotes = debounce(300, fuzzy(notes, {keys: ["content"]}))
  $: filteredNotes = search ? searchNotes(search) : notes

  const since = now()
  const maxNotes = 100
  const seen = new Set()
  const getModal = () => last(document.querySelectorAll(".modal-content"))
  const canDisplay = e => noteKinds.includes(e.kind)

  const setFeedRelay = relay => {
    feedRelay = relay

    setTimeout(() => {
      feedScroller?.stop()
      feedScroller = !relay ? null : createScroller(loadMore, {element: getModal()})
    }, 300)
  }

  const loadBufferedNotes = () => {
    // Drop notes at the end if there are a lot
    notes = uniqBy(prop("id"), notesBuffer.concat(notes).slice(0, maxNotes))
    notesBuffer = []

    document.body.scrollIntoView({behavior: "smooth"})
  }

  const onChunk = async newNotes => {
    const _key = key

    // Deduplicate and filter out stuff we don't want, apply user preferences
    const filtered = user.applyMutes(newNotes.filter(n => !seen.has(n.id) && shouldDisplay(n)))

    // Keep track of what we've seen
    for (const note of filtered) {
      seen.add(note.id)
    }

    // Load parents before showing the notes so we have hierarchy. Give it a short
    // timeout, since this is really just a nice-to-have
    const notesWithParent = filtered.filter(findReplyId)

    const parents =
      notesWithParent.length === 0
        ? []
        : await network.load({
            timeout: parentsTimeout,
            filter: {ids: notesWithParent.map(findReplyId)},
            relays: routing.mergeHints(
              user.getSetting("relay_limit"),
              notesWithParent.map(e => routing.getParentHints(3, e))
            ),
          })

    // Keep track of parents too
    for (const note of parents) {
      seen.add(note.id)
    }

    // Combine notes and parents into a single collection
    const combined = uniqBy(
      prop("id"),
      filtered.filter(canDisplay).concat(parents).map(asDisplayEvent)
    )

    // Stream in additional data and merge it in
    legacyNetwork.streamContext({
      maxDepth: 2,
      notes: combined.filter(canDisplay),
      onChunk: context => {
        context = user.applyMutes(context)

        notesBuffer = legacyNetwork.applyContext(notesBuffer, context)
        notes = legacyNetwork.applyContext(notes, context)
      },
    })

    // Show replies grouped by parent whenever possible
    const merged = sortBy(e => -e.created_at, mergeParents(combined))

    // Notify caller if they asked for it
    for (const e of merged) {
      onEvent?.(e)
    }

    // Split into notes before and after we started loading
    const [bottom, top] = partition(e => e.created_at < since, merged)

    // Slice new notes in case someone leaves the tab open for a long time
    if (_key === key) {
      notesBuffer = top.concat(notesBuffer).slice(0, maxNotes)
      notes = uniqBy(prop("id"), notes.concat(bottom))
    }
  }

  let p = Promise.resolve()

  const getRelays = () => {
    if (relays) {
      return relays
    }

    // If we have a search term we need to use only relays that support search
    if (filter.search) {
      return routing.getSearchRelays()
    }

    const limit = user.getSetting("relay_limit")
    const authors = (compileFilter(filter).authors || []).concat(user.getPubkey())
    const hints = authors.map(pubkey => routing.getPubkeyHints(limit, pubkey))

    return routing.mergeHints(limit, hints)
  }

  const loadMore = async () => {
    const _key = key

    // Wait for this page to load before trying again
    await cursor.loadPage({
      filter: compileFilter(filter),
      onChunk: chunk => {
        // Stack promises to avoid too many concurrent subscriptions
        p = p.then(() => key === _key && onChunk(chunk))
      },
    })
  }

  export const stop = () => {
    notes = []
    notesBuffer = []
    scroller?.stop()
    feedScroller?.stop()
    unsubscribe?.()
    key = Math.random()
  }

  export const start = (newFilter = null) => {
    if (!equals(newFilter, filter)) {
      stop()

      const _key = key

      if (newFilter) {
        filter = newFilter
      }

      // No point in subscribing if we have an end date
      if (!filter.until) {
        unsubscribe = network.subscribe({
          relays: getRelays(),
          filter: compileFilter({...filter, since}),
          onEvent: batch(500, chunk => {
            p = p.then(() => _key === key && onChunk(chunk))
          }),
        })
      }

      cursor = new legacyNetwork.Cursor({
        relays: getRelays(),
        until: filter.until || now(),
        delta,
      })

      scroller = createScroller(loadMore, {element: getModal()})
    }
  }

  onMount(start)
  onDestroy(stop)
</script>

<Content size="inherit" gap="gap-6">
  {#if notesBuffer.length > 0}
    <div class="pointer-events-none fixed bottom-0 left-0 z-10 mb-8 flex w-full justify-center">
      <button
        in:fly={{y: 20}}
        class="pointer-events-auto cursor-pointer rounded-full border border-solid
               border-accent-light bg-accent px-4 py-2 text-center text-white
               shadow-lg transition-colors hover:bg-accent-light"
        on:click={loadBufferedNotes}>
        Load {quantify(notesBuffer.length, "new note")}
      </button>
    </div>
  {/if}

  {#if !hideControls}
    <FeedControls {filter} onChange={start}>
      <slot name="controls" slot="controls" />
    </FeedControls>
  {/if}

  <div class="flex flex-col gap-4">
    {#each filteredNotes as note (note.id)}
      <Note depth={2} {note} {feedRelay} {setFeedRelay} {invertColors} />
    {/each}
  </div>

  <Spinner />
</Content>

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} {notes} depth={2} />
  </Modal>
{/if}
