<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {NOTE} from "@welshman/util"
  import {nthEq, sortBy} from "@welshman/lib"
  import {repository, trackerStore} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import {pushModal} from "@app/modal"
  import {decodeNRelay} from "@app/state"

  const url = decodeNRelay($page.params.nrelay)

  const createThread = () => pushModal(ThreadCreate, {url})

  let limit = 10
  let loading = true
  let element: Element

  $: events = sortBy(
    e => -e.created_at,
    Array.from($trackerStore.getIds(url))
      .map(id => repository.eventsById.get(id)!)
      .filter(e => e?.kind === NOTE && !e.tags.some(nthEq(0, "e"))),
  )

  onMount(() => {
    const scroller = createScroller({
      element: element.closest(".max-h-screen")!,
      onScroll: async () => {
        limit += 10
      },
    })

    return () => scroller.stop()
  })

  setTimeout(() => {
    loading = false
  }, 3000)
</script>

<div class="relative flex h-screen flex-col" bind:this={element}>
  <PageBar>
    <div slot="icon" class="center">
      <Icon icon="notes-minimalistic" />
    </div>
    <strong slot="title">Threads</strong>
  </PageBar>
  <div class="flex flex-grow flex-col gap-2 overflow-auto p-2">
    {#each events.slice(0, limit) as event (event.id)}
      <ThreadItem {event} />
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
  <Button
    class="tooltip tooltip-left fixed bottom-16 right-2 z-feature p-1 sm:bottom-4 sm:right-4"
    data-tip="Create an Event"
    on:click={createThread}>
    <div class="btn btn-circle btn-primary flex h-12 w-12 items-center justify-center">
      <Icon icon="notes-minimalistic" />
    </div>
  </Button>
</div>
