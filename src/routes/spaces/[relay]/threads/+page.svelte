<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {sortBy, max, nthEq} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {THREAD, REACTION, DELETE, COMMENT, getListTags, getPubkeyTagValues} from "@welshman/util"
  import {userMutes} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import {decodeRelay, getEventsForUrl} from "@app/state"
  import {setChecked} from "@app/notifications"
  import {makeFeed} from "@app/requests"
  import {pushModal} from "@app/modal"

  const url = decodeRelay($page.params.relay)
  const mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
  const threads: TrustedEvent[] = $state([])
  const comments: TrustedEvent[] = $state([])

  let loading = $state(true)
  let element: HTMLElement | undefined = $state()

  const createThread = () => pushModal(ThreadCreate, {url})

  const events = $derived.by(() => {
    const scores = new Map<string, number>()

    for (const comment of comments) {
      const id = comment.tags.find(nthEq(0, "E"))?.[1]

      if (id) {
        scores.set(id, max([scores.get(id), comment.created_at]))
      }
    }

    return sortBy(e => -max([scores.get(e.id), e.created_at]), threads)
  })

  onMount(() => {
    const {cleanup} = makeFeed({
      element: element!,
      relays: [url],
      feedFilters: [{kinds: [THREAD, COMMENT]}],
      subscriptionFilters: [
        {kinds: [THREAD, REACTION, DELETE]},
        {kinds: [COMMENT], "#K": [String(THREAD)]},
      ],
      initialEvents: getEventsForUrl(url, [{kinds: [THREAD, COMMENT], limit: 10}]),
      onEvent: event => {
        if (event.kind === THREAD && !mutedPubkeys.includes(event.pubkey)) {
          threads.push(event)
        }

        if (event.kind === COMMENT) {
          comments.push(event)
        }
      },
      onExhausted: () => {
        loading = false
      },
    })

    return () => {
      cleanup()
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
    {#each events as event (event.id)}
      <div in:fly>
        <ThreadItem {url} event={$state.snapshot(event)} />
      </div>
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      <Spinner {loading}>
        {#if loading}
          Looking for threads...
        {:else if events.length === 0}
          No threads found.
        {:else}
          That's all!
        {/if}
      </Spinner>
    </p>
  </div>
</div>
