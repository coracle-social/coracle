<script lang="ts">
  import type {DynamicFilter, DisplayEvent} from "src/engine/types"
  import {onMount, onDestroy} from "svelte"
  import {readable, derived, writable} from "svelte/store"
  import {FeedLoader} from "src/engine"
  import {last, equals} from "ramda"
  import {fly} from "src/util/transition"
  import {quantify} from "hurdak"
  import {createScroller, now} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Note from "src/app/shared/Note.svelte"
  import engine, {User, Keys, Nip65} from "src/app/engine"
  import {compileFilter} from "src/app/state"

  export let relays = []
  export let filter = {} as DynamicFilter
  export let invertColors = false
  export let hideControls = false
  export let onEvent = null

  let scroller, feed, scrollerElement
  let feedRelay = null
  let feedScroller = null
  let newNotes = readable([])
  let oldNotes = readable([])

  const since = writable(now())

  const getModal = () => last(Array.from(document.querySelectorAll(".modal-content")))

  const setFeedRelay = relay => {
    feedRelay = relay

    setTimeout(() => {
      feedScroller?.stop()
      feedScroller = !relay ? null : createScroller(loadMore, {element: getModal()})
    }, 300)
  }

  const loadBufferedNotes = () => {
    since.set(now())

    document.body.scrollIntoView({behavior: "smooth"})
  }

  const getRelays = () => {
    if (relays.length > 0) {
      return relays
    }

    // If we have a search term we need to use only relays that support search
    if (filter.search) {
      return Nip65.getSearchRelays()
    }

    const limit = User.getSetting("relay_limit")
    const authors = (compileFilter(filter).authors || []).concat(Keys.pubkey.get())
    const hints = authors.map(pubkey => Nip65.getPubkeyHints(limit, pubkey))

    return Nip65.mergeHints(limit, hints)
  }

  const loadMore = () => feed.load(5)

  export const stop = () => {
    feed?.stop()
    scroller?.stop()
    feedScroller?.stop()
  }

  export const start = (newFilter = null) => {
    if (!equals(newFilter, filter)) {
      stop()

      if (newFilter) {
        filter = newFilter
      }

      feed = new FeedLoader(engine, {
        depth: 2,
        relays: getRelays(),
        filter: compileFilter(filter),
        shouldLoadParents: true,
        onEvent,
      })

      scroller = createScroller(loadMore, {element: scrollerElement})

      since.set(now())

      newNotes = derived([feed.feed, since], ([$notes, $since]) =>
        ($notes as DisplayEvent[]).filter(e => e.created_at > $since)
      )

      oldNotes = derived([feed.feed, since], ([$notes, $since]) =>
        ($notes as DisplayEvent[]).filter(e => e.created_at <= $since)
      )
    }
  }

  onMount(() => {
    scrollerElement = getModal()
    start()
  })

  onDestroy(stop)
</script>

<Content size="inherit" gap="gap-6">
  {#if $newNotes?.length > 0}
    <div class="pointer-events-none fixed bottom-0 left-0 z-10 mb-8 flex w-full justify-center">
      <button
        in:fly={{y: 20}}
        class="pointer-events-auto cursor-pointer rounded-full border border-solid
               border-accent-light bg-accent px-4 py-2 text-center text-white
               shadow-lg transition-colors hover:bg-accent-light"
        on:click={loadBufferedNotes}>
        Load {quantify($newNotes.length, "new note")}
      </button>
    </div>
  {/if}

  {#if !hideControls}
    <FeedControls {filter} onChange={start}>
      <slot name="controls" slot="controls" />
    </FeedControls>
  {/if}

  <div class="flex flex-col gap-4">
    {#each $oldNotes as note (note.id)}
      <Note depth={2} {note} {feedRelay} {setFeedRelay} {invertColors} />
    {/each}
  </div>

  <Spinner />
</Content>

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} notes={$oldNotes} depth={2} />
  </Modal>
{/if}
