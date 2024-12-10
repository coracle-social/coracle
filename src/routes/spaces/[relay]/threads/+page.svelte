<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {page} from "$app/stores"
  import {sortBy, min, nthEq, sleep} from "@welshman/lib"
  import {getListTags, getPubkeyTagValues, THREAD, COMMENT} from "@welshman/util"
  import {throttled} from "@welshman/store"
  import {feedsFromFilters, makeIntersectionFeed, makeRelayFeed} from "@welshman/feeds"
  import {createFeedController, userMutes} from "@welshman/app"
  import {createScroller, type Scroller} from "@lib/html"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import {LEGACY_THREAD, decodeRelay, deriveEventsForUrl} from "@app/state"
  import {THREAD_FILTERS, setChecked} from "@app/notifications"
  import {pushModal} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const threads = deriveEventsForUrl(url, [{kinds: [THREAD, LEGACY_THREAD]}])
  const comments = deriveEventsForUrl(url, [
    {kinds: [COMMENT], "#K": [String(THREAD), String(LEGACY_THREAD)]},
  ])
  const mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))

  const events = throttled(
    800,
    derived([threads, comments], ([$threads, $comments]) => {
      const scores = new Map<string, number>()

      for (const comment of $comments) {
        const id = comment.tags.find(nthEq(0, "E"))?.[1]

        if (id) {
          scores.set(id, min([scores.get(id), -comment.created_at]))
        }
      }

      return sortBy(
        e => min([scores.get(e.id), -e.created_at]),
        $threads.filter(e => !mutedPubkeys.includes(e.pubkey)),
      )
    }),
  )

  const createThread = () => pushModal(ThreadCreate, {url})

  const ctrl = createFeedController({
    useWindowing: true,
    feed: makeIntersectionFeed(makeRelayFeed(url), feedsFromFilters(THREAD_FILTERS)),
    onExhausted: () => {
      loading = false
    },
  })

  let limit = 10
  let loading = true
  let unmounted = false
  let element: Element
  let scroller: Scroller

  onMount(() => {
    // Element is frequently not defined. I don't know why
    sleep(1000).then(() => {
      if (!unmounted) {
        scroller = createScroller({
          element,
          delay: 300,
          threshold: 3000,
          onScroll: () => {
            limit += 10

            if ($events.length - limit < 10) {
              ctrl.load(50)
            }
          },
        })
      }
    })

    return () => {
      unmounted = true
      scroller?.stop()
      setChecked($page.url.pathname)
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
      <MenuSpaceButton {url} />
    </div>
  </PageBar>
  <div class="flex flex-grow flex-col gap-2 overflow-auto p-2">
    {#each $events as event (event.id)}
      <div in:fly>
        <ThreadItem {url} {event} />
      </div>
    {/each}
    {#if loading || $events.length === 0}
      <p class="flex h-10 items-center justify-center py-20" out:fly>
        <Spinner {loading}>
          {#if loading}
            Looking for threads...
          {:else if $events.length === 0}
            No threads found.
          {/if}
        </Spinner>
      </p>
    {/if}
  </div>
</div>
