<script lang="ts">
  import {onMount} from "svelte"
  import {sortBy, flatten} from "@welshman/lib"
  import {feedFromFilter} from "@welshman/feeds"
  import {NOTE, getAncestorTags} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {repository, feedLoader} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteItem from "@app/components/NoteItem.svelte"

  export let url
  export let pubkey

  const filter = {kinds: [NOTE], authors: [pubkey]}
  const events = deriveEvents(repository, {filters: [filter]})
  const loader = feedLoader.getLoader(feedFromFilter(filter), {})

  let element: Element

  onMount(() => {
    const scroller = createScroller({
      element,
      onScroll: async () => {
        const $loader = await loader

        $loader(5)
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="flex max-w-full flex-col gap-4 p-4" bind:this={element}>
  <div class="flex flex-col gap-2">
    {#each sortBy(e => -e.created_at, $events) as event (event.id)}
      {#if flatten(Object.values(getAncestorTags(event.tags))).length === 0}
        <NoteItem {url} {event} />
      {/if}
    {:else}
      <p class="flex center my-12">
        <Spinner loading />
      </p>
    {/each}
  </div>
</div>
