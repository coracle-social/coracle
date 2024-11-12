<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {ago, assoc} from "@welshman/lib"
  import {getListTags, getPubkeyTagValues} from "@welshman/util"
  import type {Filter} from "@welshman/util"
  import {feedsFromFilters, makeIntersectionFeed, makeRelayFeed} from "@welshman/feeds"
  import {nthEq} from "@welshman/lib"
  import {createFeedController, userMutes} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import {THREAD, COMMENT, deriveEventsForUrl, decodeRelay} from "@app/state"
  import {pushModal, pushDrawer} from "@app/modal"
  import {subscribePersistent} from "@app/commands"

  const url = decodeRelay($page.params.relay)
  const events = deriveEventsForUrl(url, [{kinds: [THREAD]}])
  const mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
  const filters: Filter[] = [{kinds: [THREAD]}, {kinds: [COMMENT], "#K": [String(THREAD)]}]
  const feed = makeIntersectionFeed(makeRelayFeed(url), feedsFromFilters(filters))

  const openMenu = () => pushDrawer(MenuSpace, {url})

  const createThread = () => pushModal(ThreadCreate, {url})

  let limit = 5
  let loading = true
  let element: Element

  onMount(() => {
    const ctrl = createFeedController({
      feed,
      onExhausted: () => {
        loading = false
      },
    })

    const unsub = subscribePersistent({
      filters: filters.map(assoc("since", ago(30))),
      relays: [url],
    })

    const scroller = createScroller({
      element,
      delay: 300,
      threshold: 3000,
      onScroll: async () => {
        limit += 5

        await ctrl.load(5)
      },
    })

    return () => {
      unsub()
      scroller.stop()
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
    {#each $events.slice(0, limit) as event (event.id)}
      {#if !event.tags.some(nthEq(0, "e")) && !mutedPubkeys.includes(event.pubkey)}
        <ThreadItem {url} {event} />
      {/if}
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      <Spinner {loading}>
        {#if loading}
          Looking for threads...
        {:else if $events.length === 0}
          No threads found.
        {/if}
      </Spinner>
    </p>
  </div>
</div>
