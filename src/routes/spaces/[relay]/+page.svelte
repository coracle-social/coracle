<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {NOTE, getListTags, getPubkeyTagValues} from "@welshman/util"
  import {feedFromFilter, makeIntersectionFeed, makeRelayFeed} from "@welshman/feeds"
  import {nthEq} from "@welshman/lib"
  import {feedLoader, userMutes} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import {REPLY, deriveEventsForUrl, decodeRelay} from "@app/state"
  import {pushModal, pushDrawer} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const events = deriveEventsForUrl(url, [NOTE])
  const mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
  const feed = makeIntersectionFeed(makeRelayFeed(url), feedFromFilter({kinds: [NOTE, REPLY]}))
  const loader = feedLoader.getLoader(feed, {
    onExhausted: () => {
      loading = false
    },
  })

  const openMenu = () => pushDrawer(MenuSpace, {url})

  const createThread = () => pushModal(ThreadCreate, {url})

  let limit = 5
  let loading = true
  let element: Element

  onMount(() => {
    // Why is element not defined sometimes? SVELTEKIT
    if (element) {
      const scroller = createScroller({
        element,
        delay: 300,
        threshold: 3000,
        onScroll: async () => {
          const $loader = await loader

          await $loader(5)
          limit += 5
        },
      })

      return () => scroller.stop()
    }
  })
</script>

<div class="relative flex h-screen flex-col">
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
  <div class="flex flex-grow flex-col gap-2 overflow-auto p-2" bind:this={element}>
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
