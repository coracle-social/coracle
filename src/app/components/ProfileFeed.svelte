<script lang="ts">
  import {onMount} from "svelte"
  import {sortBy, uniqBy} from "@welshman/lib"
  import {feedFromFilter, makeIntersectionFeed, makeRelayFeed} from "@welshman/feeds"
  import {NOTE, getReplyTags} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {createFeedController} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import {fly} from "@lib/transition"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteItem from "@app/components/NoteItem.svelte"

  export let url
  export let pubkey
  export let events: TrustedEvent[] = []
  export let hideLoading = false

  const ctrl = createFeedController({
    useWindowing: true,
    feed: makeIntersectionFeed(
      makeRelayFeed(url),
      feedFromFilter({kinds: [NOTE], authors: [pubkey]}),
    ),
    onEvent: (event: TrustedEvent) => {
      if (getReplyTags(event.tags).replies.length === 0) {
        buffer.push(event)
      }
    },
  })

  let element: Element
  let buffer: TrustedEvent[] = []

  onMount(() => {
    const scroller = createScroller({
      element,
      delay: 300,
      threshold: 3000,
      onScroll: () => {
        buffer = uniqBy(
          e => e.id,
          sortBy(e => -e.created_at, buffer),
        )
        events = [...events, ...buffer.splice(0, 5)]

        if (buffer.length < 50) {
          ctrl.load(50)
        }
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="col-4" bind:this={element}>
  <div class="flex flex-col gap-2">
    {#each events as event (event.id)}
      <div in:fly>
        <NoteItem {url} {event} />
      </div>
    {/each}
    {#if !hideLoading}
      <p class="center my-12 flex">
        <Spinner loading />
      </p>
    {/if}
  </div>
</div>
