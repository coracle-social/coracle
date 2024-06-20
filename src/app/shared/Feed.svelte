<script lang="ts">
  import {onMount} from "svelte"
  import {randomInt} from "hurdak"
  import {writable, hash} from "@welshman/lib"
  import {createScroller, synced} from "src/util/misc"
  import {fly, fade} from "src/util/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Note from "src/app/shared/Note.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import {createFeed, router} from "src/app/util"
  import type {Feed} from "src/domain"
  import {env} from 'src/engine'

  export let feed: Feed
  export let anchor = null
  export let eager = false
  export let contextAddress = null
  export let skipNetwork = false
  export let forcePlatform = true
  export let shouldListen = false
  export let showControls = false
  export let hideSpinner = false
  export let includeReposts = false
  export let showGroup = false
  export let onEvent = null

  const splits = [["zap", $env.PLATFORM_PUBKEY, "", "1"]]

  const shouldHideReplies = showControls ? synced("Feed.shouldHideReplies", false) : writable(false)

  const reload = async () => {
    limit = 0
    loader?.stop()
    loader = createFeed({
      anchor,
      onEvent,
      skipNetwork,
      forcePlatform,
      shouldListen,
      includeReposts,
      shouldDefer: !eager,
      shouldLoadParents: true,
      shouldHideReplies: $shouldHideReplies,
      feed: feed.definition,
    })
  }

  const toggleReplies = () => {
    $shouldHideReplies = !$shouldHideReplies
    reload()
  }

  const updateFeed = newFeed => {
    feed = newFeed
    reload()
  }

  const loadMore = async () => {
    limit += 10

    if ($loader.notes.length < limit) {
      await loader.loadMore(20)
    }
  }

  let element, loader
  let limit = 0

  reload()

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => {
      loader.stop()
      scroller.stop()
    }
  })
</script>

{#if showControls}
  <FeedControls {feed} {updateFeed}>
    <div slot="controls">
      {#if $shouldHideReplies}
        <Anchor button low class="border-none opacity-50" on:click={toggleReplies}>Replies</Anchor>
      {:else}
        <Anchor button accent class="border-none" on:click={toggleReplies}>Replies</Anchor>
      {/if}
    </div>
  </FeedControls>
{/if}

<FlexColumn xl bind:element>
  {#each $loader.notes.slice(0, limit) as note, i (note.id)}
    <div in:fly={{y: 20}}>
      <Note
        filters={loader.getFilters() || [{ids: []}]}
        depth={$shouldHideReplies ? 0 : 2}
        {contextAddress}
        {showGroup}
        {anchor}
        {note} />
    </div>
    {#if i > 20 && parseInt(hash(note.id)) % 100 === 0}
      <Card class="flex items-center justify-between">
        <p class="text-xl">Enjoying Coracle?</p>
        <Anchor modal button accent href={router.at("zap").qp({splits}).toString()}>
          Zap the developer
        </Anchor>
      </Card>
    {/if}
  {/each}
</FlexColumn>

{#if !hideSpinner}
  {#if $loader.done}
    <div transition:fly|local={{y: 20, delay: 500}} class="flex flex-col items-center py-24">
      <img class="h-20 w-20" src="/images/pumpkin.png" />
      That's all!
    </div>
  {:else}
    <div out:fade|local>
      <Spinner />
    </div>
  {/if}
{/if}
