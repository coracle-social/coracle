<script lang="ts">
  import {onMount} from "svelte"
  import {Storage} from "hurdak"
  import {writable, readable} from "@coracle.social/lib"
  import {FeedLoader} from "src/engine"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import {getModal} from "src/partials/state"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {DynamicFilter} from "src/engine"
  import {compileFilters} from "src/engine"

  export let relays = []
  export let filter: DynamicFilter = {}
  export let anchor = null
  export let eager = false
  export let skipCache = false
  export let skipNetwork = false
  export let skipPlatform = false
  export let shouldListen = false
  export let hideControls = false
  export let hideSpinner = false
  export let includeReposts = false
  export let showGroup = false
  export let onEvent = null

  let feed
  let notes = readable([])

  const hideReplies = writable(Storage.getJson("hideReplies"))

  const loadMore = () => feed.load(5)

  const start = () => {
    feed?.stop()

    feed = new FeedLoader({
      filters: [filter],
      relays,
      anchor,
      skipCache,
      skipNetwork,
      skipPlatform,
      shouldListen,
      shouldDefer: !eager,
      shouldLoadParents: true,
      shouldHideReplies: $hideReplies,
      includeReposts: includeReposts,
      onEvent,
    })

    notes = feed.notes
  }

  const updateFilter = newFilter => {
    filter = newFilter

    start()
  }

  const unsubHideReplies = hideReplies.subscribe($hideReplies => {
    start()
    Storage.setJson("hideReplies", $hideReplies)
  })

  onMount(() => {
    const scroller = createScroller(loadMore, {element: getModal()})

    return () => {
      unsubHideReplies()
      scroller?.stop()
      feed?.stop()
    }
  })
</script>

{#if !hideControls}
  <FeedControls {hideReplies} {filter} {relays} {updateFilter}>
    <slot name="controls" slot="controls" />
  </FeedControls>
{/if}

<FlexColumn xl>
  {#each $notes as note, i (note.id)}
    <div in:fly={{y: 20}}>
      <Note
        depth={$hideReplies ? 0 : 2}
        context={note.replies || []}
        filters={compileFilters([filter])}
        {showGroup}
        {anchor}
        {note} />
    </div>
  {/each}
</FlexColumn>

{#if !hideSpinner}
  <Spinner />
{/if}
