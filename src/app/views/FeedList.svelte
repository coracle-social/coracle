<script type="ts">
  import {modal} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import FeedSummary from 'src/app/shared/FeedSummary.svelte'
  import user from "src/agent/user"

  const {feeds} = user

  const createFeed = () => {
    modal.push({type: "feed/edit"})
  }

  const removeFeed = feed => {
    user.removeFeed(feed.id)
  }

  const editFeed = feed => {
    modal.push({type: "feed/edit", feed})
  }
</script>

<Content>
  <div class="flex items-center justify-between">
    <Heading>Custom Feeds</Heading>
    <Anchor type="button-accent" on:click={createFeed}>
      <i class="fa fa-plus" /> Feed
    </Anchor>
  </div>
  <p>
    You custom feeds are listed below. You can create new custom feeds by handing using the "add
    feed" button, or by clicking the <i class="fa fa-scroll px-1" /> icon that appears throughout
    Coracle.
  </p>
  {#each $feeds as feed (feed.name)}
    <div class="flex justify-start gap-3">
      <i
        class="fa fa-sm fa-trash cursor-pointer py-3"
        on:click|stopPropagation={() => removeFeed(feed)} />
      <div class="flex w-full justify-between">
        <div>
          <strong>{feed.name}</strong>
          <FeedSummary {feed} />
        </div>
        <Anchor on:click={() => editFeed(feed)}>Edit</Anchor>
      </div>
    </div>
  {:else}
    <p class="text-center py-12">You don't have any custom feeds yet.</p>
  {/each}
</Content>
