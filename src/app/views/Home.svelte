<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import {NAMED_BOOKMARKS} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import Feeds from "src/app/views/Feeds.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {makeFeed, readFeed, mapListToFeed, readUserList} from "src/domain"
  import {deriveEvent} from "src/engine"

  export let feed = null
  export let topic = null
  export let address = null

  const event = address ? deriveEvent(address) : null

  const getFeed = async (e: TrustedEvent) =>
    address.startsWith(NAMED_BOOKMARKS) ? mapListToFeed(await readUserList(e)) : readFeed(e)
</script>

{#if address}
  {#if $event}
    {#await getFeed($event)}
      <Spinner />
    {:then loadedFeed}
      {#key loadedFeed}
        <Feeds feed={loadedFeed} />
      {/key}
    {/await}
  {:else}
    <Spinner />
  {/if}
{:else}
  <Feeds feed={topic ? makeFeed({definition: makeTagFeed("#t", topic)}) : feed} />
{/if}
