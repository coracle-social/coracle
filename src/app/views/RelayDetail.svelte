<script lang="ts">
  import {displayRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import {makeRelayFeed} from "@welshman/feeds"
  import {Relays} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import Feed from "src/app/shared/Feed.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {makeFeed} from "src/domain"

  export let url

  const relay = fromApp($app => $app.use(Relays).one(url))

  const notesFeed = makeFeed({
    definition: makeRelayFeed(url),
  })

  $: url = normalizeRelayUrl(url)

  document.title = displayRelayUrl(url)
</script>

<div class="flex items-center justify-between gap-2">
  <RelayTitle {url} />
  <RelayActions {url} />
</div>
{#if $relay?.description}
  <p>{$relay?.description}</p>
{/if}
<Feed feed={notesFeed} />
