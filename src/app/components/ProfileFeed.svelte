<script lang="ts">
  import {onMount} from "svelte"
  import {sortBy, flatten} from "@welshman/lib"
  import {deriveEvents} from "@welshman/store"
  import {feedFromFilter} from "@welshman/feeds"
  import {NOTE, getAncestorTags} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {repository, createFeedController} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteItem from "@app/components/NoteItem.svelte"

  export let url
  export let pubkey

  const filter = {kinds: [NOTE], authors: [pubkey]}
  const events = deriveEvents(repository, {filters: [filter]})

  let element: Element

  onMount(() => {
    const ctrl = createFeedController({feed: feedFromFilter(filter)})
    const scroller = createScroller({
      element,
      delay: 300,
      threshold: 3000,
      onScroll: () => ctrl.load(5)
    })

    return () => scroller.stop()
  })
</script>

<div class="col-4" bind:this={element}>
  <div class="flex flex-col gap-2">
    {#each sortBy(e => -e.created_at, $events) as event (event.id)}
      {#if flatten(Object.values(getAncestorTags(event.tags))).length === 0}
        <NoteItem {url} {event} />
      {/if}
    {/each}
    <p class="center my-12 flex">
      <Spinner loading />
    </p>
  </div>
</div>
