<script type="ts">
  import {getAddress} from '@welshman/util'
  import {tryJson} from 'src/util/misc'
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import {router} from "src/app/util/router"
  import {getFeedTitle} from "src/domain"
  import {userFeeds, publishDeletion} from "src/engine"

  const createFeed = () => router.at("feeds/create").open()

  const editFeed = address => router.at("feeds").of(address).open()
</script>

<div class="flex items-center justify-between">
  <Heading>Your Feeds</Heading>
  <Anchor button accent on:click={createFeed}>
    <i class="fa fa-plus" /> Feed
  </Anchor>
</div>
{#each $userFeeds as event (getAddress(event))}
  {@const address = getAddress(event)}
  {@const feed = tryJson(() => JSON.parse(event.content))}
  <div class="flex justify-start gap-3">
    <i
      class="fa fa-sm fa-trash cursor-pointer py-3"
      on:click|stopPropagation={() => publishDeletion([address])} />
    <div class="flex w-full justify-between">
      <div>
        <strong>{getFeedTitle(event)}</strong>
        <FeedSummary {feed} />
      </div>
      <Anchor class="underline" on:click={() => editFeed(address)}>Edit</Anchor>
    </div>
  </div>
{:else}
  <p class="text-center py-12">You don't have any feeds yet.</p>
{/each}
