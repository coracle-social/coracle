<script lang="ts">
  import {onMount} from "svelte"
  import {Storage} from "hurdak"
  import {prop} from "ramda"
  import type {Filter} from "@welshman/util"
  import type {Feed} from "@welshman/feeds"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Note from "src/app/shared/Note.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import {FeedLoader} from "src/app/util"

  export let feed: Feed
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

  let element
  let filters: Filter[] = [{ids: []}]
  let limit = 0
  let opts = {
    feed,
    anchor,
    onEvent,
    skipCache,
    skipNetwork,
    skipPlatform,
    shouldListen,
    includeReposts,
    shouldDefer: !eager,
    shouldLoadParents: true,
    shouldHideReplies: Storage.getJson("hideReplies"),
  }

  const {notes, start, load, feedLoader} = new FeedLoader(opts)

  const loadMore = async () => {
    limit += 5

    if ($notes.length < limit) {
      await load(20)
    }
  }

  const update = async opts => {
    limit = 0
    start(opts)

    if (feedLoader.compiler.canCompile(opts.feed)) {
      const requests = await feedLoader.compiler.compile(opts.feed)

      filters = requests.flatMap(r => r.filters)
    } else {
      filters = [{ids: []}]
    }
  }

  $: {
    update(opts)
    Storage.setJson("hideReplies", opts.shouldHideReplies)
  }

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => scroller.stop()
  })
</script>

{#if !hideControls}
  <FeedControls bind:value={opts} />
{/if}

<FlexColumn xl bind:element>
  {#each $notes.slice(0, limit) as note, i (note.id)}
    <div in:fly={{y: 20}}>
      <Note
        depth={opts.shouldHideReplies ? 0 : 2}
        context={note.replies || []}
        {showGroup}
        {filters}
        {anchor}
        {note} />
    </div>
  {/each}
</FlexColumn>

{#if !hideSpinner}
  <Spinner />
{/if}
