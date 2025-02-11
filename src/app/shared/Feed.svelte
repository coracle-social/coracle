<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {WEEK, now, ago, uniqBy, hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {synced} from "@welshman/store"
  import type {FeedController, Feed as FeedDefinition} from "@welshman/feeds"
  import {
    isRelayFeed,
    makeKindFeed,
    makeIntersectionFeed,
    isKindFeed,
    walkFeed,
  } from "@welshman/feeds"
  import {createScroller} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
  import {fly, fade} from "src/util/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NoteReducer from "src/app/shared/NoteReducer.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import {router} from "src/app/util"
  import type {Feed} from "src/domain"
  import {env, createFeedController, sortEventsDesc} from "src/engine"
  import FeedItem from "src/app/shared/FeedItem.svelte"

  export let feed: Feed
  export let anchor = null
  export let showControls = false
  export let forcePlatform = true
  export let hideSpinner = false
  export let shouldSort = false
  export let maxDepth = 2

  let abortController = new AbortController()

  const splits = [["zap", env.PLATFORM_PUBKEY, "", "1"]]

  const promptDismissed = synced("feed/promptDismissed", 0)

  const shouldHideReplies = showControls ? synced("Feed.shouldHideReplies", false) : writable(false)

  const reload = () => {
    abortController.abort()
    abortController = new AbortController()
    exhausted = false
    useWindowing = true
    events = []
    buffer = []

    let hasKinds = false

    walkFeed(feed.definition, (subFeed: FeedDefinition) => {
      hasKinds = hasKinds || isKindFeed(subFeed)
      useWindowing = useWindowing && !isRelayFeed(subFeed)
    })

    const definition = hasKinds
      ? feed.definition
      : makeIntersectionFeed(makeKindFeed(...noteKinds), feed.definition)

    ctrl = createFeedController({
      feed: definition,
      forcePlatform,
      useWindowing,
      signal: abortController.signal,
      onEvent: e => {
        buffer.push(e)
      },
      onExhausted: () => {
        exhausted = true
      },
    })

    if (!useWindowing) {
      ctrl.load(1000)
    }
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
    buffer = uniqBy(e => e.id, sortEventsDesc(buffer))
    events = [...events, ...buffer.splice(0, 10)]

    if (useWindowing && buffer.length < 25) {
      ctrl.load(25)
    }
  }

  let element
  let depth = 0
  let exhausted = false
  let useWindowing = true
  let ctrl: FeedController
  let events: TrustedEvent[] = []
  let buffer: TrustedEvent[] = []

  $: {
    depth = $shouldHideReplies ? 0 : maxDepth
    reload()
  }

  onMount(() => {
    const scroller = createScroller(loadMore, {
      element,
      delay: 300,
      threshold: 3000,
    })

    return () => {
      scroller.stop()
      abortController.abort()
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

<FlexColumn bind:element>
  {#key feed.identifier}
    <NoteReducer
      {shouldSort}
      {depth}
      {events}
      hideReplies={$shouldHideReplies}
      let:event
      let:getContext
      let:i>
      <div in:fly={{y: 20}}>
        <FeedItem showMeta topLevel {getContext} {depth} {anchor} note={event} />
      </div>
      {#if i > 20 && parseInt(hash(event.id)) % 100 === 0 && $promptDismissed < ago(WEEK)}
        <Card class="group flex items-center justify-between">
          <p class="text-xl">Enjoying Coracle?</p>
          <div class="flex gap-2">
            <Anchor
              class="hidden text-neutral-400 opacity-0 transition-all group-hover:opacity-100 sm:visible"
              on:click={() => promptDismissed.set(now())}>
              Dismiss
            </Anchor>
            <Anchor modal button accent href={router.at("zap").qp({splits}).toString()}>
              Zap the developer
            </Anchor>
          </div>
        </Card>
      {/if}
    </NoteReducer>
  {/key}
</FlexColumn>

{#if !hideSpinner}
  {#if exhausted}
    <div transition:fly|local={{y: 20, delay: 500}} class="flex flex-col items-center py-24">
      <img alt="" class="h-20 w-20" src="/images/pumpkin.png" />
      That's all!
    </div>
  {:else}
    <div out:fade|local>
      <Spinner />
    </div>
  {/if}
{/if}
