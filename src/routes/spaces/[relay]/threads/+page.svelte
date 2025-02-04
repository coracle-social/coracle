<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {page} from "$app/stores"
  import {sortBy, min, nthEq} from "@welshman/lib"
  import {THREAD, COMMENT, getListTags, getPubkeyTagValues} from "@welshman/util"
  import {throttled} from "@welshman/store"
  import {feedFromFilters, makeIntersectionFeed, makeRelayFeed} from "@welshman/feeds"
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
  import {decodeRelay, deriveEventsForUrl} from "@app/state"
  import {setChecked} from "@app/notifications"
  import {pushModal} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const threadFilter = {kinds: [THREAD]}
  const commentFilter = {kinds: [COMMENT], "#K": [String(THREAD)]}
  const feed = feedFromFilters([threadFilter, commentFilter])
  const threads = deriveEventsForUrl(url, [threadFilter])
  const comments = deriveEventsForUrl(url, [commentFilter])
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
    feed: makeIntersectionFeed(makeRelayFeed(url), feed),
    onExhausted: () => {
      loading = false
    },
  })

  let limit = 10
  let loading = $state(true)
  let element: Element | undefined = $state()
  let scroller: Scroller

  onMount(() => {
    scroller = createScroller({
      element: element!,
      delay: 300,
      threshold: 3000,
      onScroll: () => {
        limit += 10

        if ($events.length - limit < 10) {
          ctrl.load(50)
        }
      },
    })

    return () => {
      scroller?.stop()
      setChecked($page.url.pathname)
    }
  })
</script>

<div class="relative flex h-screen flex-col" bind:this={element}>
  <PageBar>
    {#snippet icon()}
      <div class="center">
        <Icon icon="notes-minimalistic" />
      </div>
    {/snippet}
    {#snippet title()}
      <strong>Threads</strong>
    {/snippet}
    {#snippet action()}
      <div class="row-2">
        <Button class="btn btn-primary btn-sm" onclick={createThread}>
          <Icon icon="notes-minimalistic" />
          Create a Thread
        </Button>
        <MenuSpaceButton {url} />
      </div>
    {/snippet}
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
