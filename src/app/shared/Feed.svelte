<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {
    WEEK,
    ctx,
    randomId,
    now,
    ago,
    identity,
    uniqBy,
    range,
    hash,
    pushToMapKey,
  } from "@welshman/lib"
  import {
    neverFilter,
    getIdFilters,
    REACTION,
    getIdOrAddress,
    getIdAndAddress,
    getAncestorTagValues,
    unionFilters,
  } from "@welshman/util"
  import type {Filter, TrustedEvent} from "@welshman/util"
  import type {FeedController, Feed as FeedDefinition} from "@welshman/feeds"
  import {
    isRelayFeed,
    makeKindFeed,
    makeIntersectionFeed,
    isKindFeed,
    walkFeed,
  } from "@welshman/feeds"
  import {repository} from "@welshman/app"
  import {createScroller, synced} from "src/util/misc"
  import {noteKinds, repostKinds, reactionKinds, isLike} from "src/util/nostr"
  import {fly, fade} from "src/util/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import {router} from "src/app/util"
  import type {Feed} from "src/domain"
  import {
    env,
    load,
    createFeedController,
    sortEventsDesc,
    isEventMuted,
    unwrapRepost,
  } from "src/engine"
  import FeedItem from "src/app/shared/FeedItem.svelte"

  export let feed: Feed
  export let anchor = null
  export let showControls = false
  export let forcePlatform = true
  export let hideSpinner = false

  const reposts = new Map<string, TrustedEvent[]>()

  const splits = [["zap", env.PLATFORM_PUBKEY, "", "1"]]

  const promptDismissed = synced("feed/promptDismissed", 0)

  const shouldHideReplies = showControls ? synced("Feed.shouldHideReplies", false) : writable(false)

  const reload = () => {
    const thisId = randomId()

    id = thisId
    exhausted = false
    useWindowing = true
    events = []
    buffer = []
    filters = [neverFilter]

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
      onEvent: async e => {
        if (id !== thisId) return false
        if (e.kind === REACTION && !isLike(e)) return false
        if (repository.isDeleted(e)) return false
        if ($isEventMuted(e, true)) return false

        const {replies} = getAncestorTagValues(e.tags)

        if ($shouldHideReplies && replies.length > 0) return false

        if (replies.length > 0 && !replies.find(id => repository.getEvent(id))) {
          await load({
            filters: getIdFilters(replies),
            relays: ctx.app.router.EventParents(e).getUrls(),
          })
        }

        buffer.push(e)
      },
      onExhausted: () => {
        exhausted = true
      },
    })

    ctrl.getRequestItems().then($requestItems => {
      const filterOnlyRequestItems = $requestItems?.filter(ri => !ri.relays?.length)

      if (filterOnlyRequestItems) {
        filters = unionFilters(filterOnlyRequestItems.flatMap(item => item.filters))
      }
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

  const getNewEvents = () => {
    const seen = new Set(events.map(getIdOrAddress))

    const isSeen = (e: TrustedEvent) => {
      if (getIdAndAddress(e).some(v => seen.has(v))) return true
      if (getAncestorTagValues(e.tags).replies.some(v => seen.has(v))) return true

      return false
    }

    const unwrap = (e: TrustedEvent) => {
      if (repostKinds.includes(e.kind)) {
        const wrappedEvent = unwrapRepost(e)

        if (wrappedEvent) {
          pushToMapKey(reposts, wrappedEvent.id, e)
          e = wrappedEvent
        }
      }

      return e
    }

    return buffer
      .splice(0, 10)
      .map((e: TrustedEvent) => {
        // If we have a repost, use its contents instead
        e = unwrap(e)

        if (isSeen(e)) return undefined

        Array.from(range(0, depth - 1)).forEach(() => {
          const parent = getAncestorTagValues(e.tags)
            .replies.map(v => repository.getEvent(v))
            .find(identity)

          // If we have a parent, show that instead, with replies grouped underneath
          if (parent) {
            e = unwrap(parent)
          }
        })

        if (isSeen(e)) return undefined
        if (repostKinds.includes(e.kind)) return undefined
        if (reactionKinds.includes(e.kind)) return undefined
        if ($isEventMuted(e, true)) return undefined

        for (const v of getIdAndAddress(e)) {
          seen.add(v)
        }

        return e
      })
      .filter(identity)
  }

  const loadMore = async () => {
    buffer = uniqBy(e => e.id, sortEventsDesc(buffer))
    events = [...events, ...getNewEvents()]

    if (useWindowing && buffer.length < 25) {
      ctrl.load(25)
    }
  }

  let id
  let element
  let exhausted = false
  let useWindowing = true
  let ctrl: FeedController
  let events: TrustedEvent[] = []
  let buffer: TrustedEvent[] = []
  let filters: Filter[] = [neverFilter]

  $: depth = $shouldHideReplies ? 0 : 2

  reload()

  onMount(() => {
    const scroller = createScroller(loadMore, {
      element,
      delay: 300,
      threshold: 3000,
    })

    return () => {
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

<FlexColumn bind:element>
  {#each events as note, i (note.id)}
    <div in:fly={{y: 20}}>
      <FeedItem topLevel {filters} {reposts} {depth} {anchor} {note} />
    </div>
    {#if i > 20 && parseInt(hash(note.id)) % 100 === 0 && $promptDismissed < ago(WEEK)}
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
  {/each}
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
