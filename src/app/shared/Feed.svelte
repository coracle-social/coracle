<script lang="ts">
  import {onMount} from "svelte"
  import {Storage} from "hurdak"
  import {writable, readable} from "@coracle.social/lib"
  import type {Feed} from "@coracle.social/feeds"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {FeedLoader} from "src/app/util"

  export let feed: Feed
  export let relays = []
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

  let loader, element
  let notes = readable([])

  const hideReplies = writable(Storage.getJson("hideReplies"))

  const loadMore = () => loader.load(20)

  const start = () => {
    loader?.stop()

    loader = new FeedLoader({
      feed,
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

    notes = loader.notes
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
    const scroller = createScroller(loadMore, {element})

    return () => {
      unsubHideReplies()
      scroller?.stop()
      loader?.stop()
    }
  })
</script>

<FlexColumn xl bind:element>
  {#await loader.config}
    <!-- pass -->
  {:then { filters }}
    {#each $notes as note, i (note.id)}
      <div in:fly={{y: 20}}>
        <Note
          depth={$hideReplies ? 0 : 2}
          context={note.replies || []}
          {filters}
          {showGroup}
          {anchor}
          {note} />
      </div>
    {/each}
  {/await}
</FlexColumn>

{#if !hideSpinner}
  <Spinner />
{/if}
