<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {sortBy, uniqBy} from "@welshman/lib"
  import {getListTags, getPubkeyTagValues} from "@welshman/util"
  import type {Filter, TrustedEvent} from "@welshman/util"
  import {feedsFromFilters, makeIntersectionFeed, makeRelayFeed} from "@welshman/feeds"
  import {nthEq} from "@welshman/lib"
  import {createFeedController, userMutes} from "@welshman/app"
  import {createScroller, type Scroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import {THREAD, COMMENT, decodeRelay} from "@app/state"
  import {pushModal, pushDrawer} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
  const filters: Filter[] = [{kinds: [THREAD]}, {kinds: [COMMENT], "#K": [String(THREAD)]}]

  const openMenu = () => pushDrawer(MenuSpace, {url})

  const createThread = () => pushModal(ThreadCreate, {url})

  let loading = true
  let element: Element
  let scroller: Scroller
  let buffer: TrustedEvent[] = []
  let events: TrustedEvent[] = []

  onMount(() => {
    let unmounted = false

    const ctrl = createFeedController({
      useWindowing: true,
      feed: makeIntersectionFeed(makeRelayFeed(url), feedsFromFilters(filters)),
      onEvent: (event: TrustedEvent) => {
        if (
          event.kind === THREAD &&
          !event.tags.some(nthEq(0, "e")) &&
          !mutedPubkeys.includes(event.pubkey)
        ) {
          buffer.push(event)
        }
      },
      onExhausted: () => {
        loading = false
      },
    })

    // Element is frequently not defined. I don't know why
    setTimeout(() => {
      if (!unmounted) {
        scroller = createScroller({
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
      }
    }, 1000)

    return () => {
      unmounted = true
      scroller?.stop()
    }
  })
</script>

<div class="relative flex h-screen flex-col" bind:this={element}>
  <PageBar>
    <div slot="icon" class="center">
      <Icon icon="notes-minimalistic" />
    </div>
    <strong slot="title">Threads</strong>
    <div slot="action" class="row-2">
      <Button class="btn btn-primary btn-sm" on:click={createThread}>
        <Icon icon="notes-minimalistic" />
        Create a Thread
      </Button>
      <Button on:click={openMenu} class="btn btn-neutral btn-sm md:hidden">
        <Icon icon="menu-dots" />
      </Button>
    </div>
  </PageBar>
  <div class="flex flex-grow flex-col gap-2 overflow-auto p-2">
    {#each events as event (event.id)}
      <ThreadItem {url} {event} />
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      <Spinner {loading}>
        {#if loading}
          Looking for threads...
        {:else if events.length === 0}
          No threads found.
        {/if}
      </Spinner>
    </p>
  </div>
</div>
