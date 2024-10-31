<script lang="ts">
  import {onMount} from "svelte"
  import {sortBy, flatten} from "@welshman/lib"
  import {feedFromFilter} from "@welshman/feeds"
  import {NOTE, getAncestorTags} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {feedLoader} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteItem from "@app/components/NoteItem.svelte"

  export let url
  export let pubkey

  const filter = {kinds: [NOTE], authors: [pubkey]}
  const loader = feedLoader.getLoader(feedFromFilter(filter), {
    onEvent: (e: TrustedEvent) => {
      events = sortBy(e => -e.created_at, [...events, e])
    },
  })

  let element: Element
  let events: TrustedEvent[] = []

  onMount(() => {
    const scroller = createScroller({
      element,
      delay: 300,
      threshold: 3000,
      onScroll: async () => {
        const $loader = await loader

        $loader(5)
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="col-4" bind:this={element}>
  <div class="flex flex-col gap-2">
    {#each events as event (event.id)}
      {#if flatten(Object.values(getAncestorTags(event.tags))).length === 0}
        <NoteItem {url} {event} />
      {/if}
    {/each}
    <p class="center my-12 flex">
      <Spinner loading />
    </p>
  </div>
</div>
