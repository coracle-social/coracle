<script type="ts">
  import {uniq} from 'ramda'
  import {modal} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import BorderLeft from "src/partials/BorderLeft.svelte"
  import Content from "src/partials/Content.svelte"
  import FeedSummary from 'src/app/shared/FeedSummary.svelte'
  import user from "src/agent/user"

  export let key
  export let value

  const label = key.slice(0, -1)
  const {feeds} = user

  const modifyFeed = feed => {
    return {...feed, [key]: uniq((feed[key] || []).concat(value))}
  }

  const selectFeed = feed => {
    modal.pop()
    modal.push({type: "feed/edit", feed: modifyFeed(feed)})
  }
</script>

<Content size="lg">
  <div class="flex items-center justify-between">
    <Heading>Select a Feed</Heading>
    <Anchor type="button-accent" on:click={() => selectFeed({})}>
      <i class="fa fa-plus" /> Feed
    </Anchor>
  </div>
  <p>
    Select a feed to modify. The selected {label} will be added to it as an additional filter.
  </p>
  {#each $feeds as feed (feed.name)}
    <BorderLeft on:click={() => selectFeed(feed)}>
      <strong>{feed.name}</strong>
      <FeedSummary {feed} />
    </BorderLeft>
  {:else}
    <p class="text-center py-12">You don't have any custom feeds yet.</p>
  {/each}
</Content>
