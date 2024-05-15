<script lang="ts">
  import {NAMED_PEOPLE, NAMED_RELAYS, NAMED_TOPICS, getAddress} from "@welshman/util"
  import {isAuthorFeed, isRelayFeed, makeListFeed} from "@welshman/feeds"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import ListForm from "src/app/shared/ListForm.svelte"
  import {makeList, isTopicFeed, isMentionFeed} from "src/domain"
  import {mention} from "src/engine"

  export let feed
  export let onChange

  const list = (() => {
    if (isAuthorFeed(feed)) {
      return makeList({kind: NAMED_PEOPLE, tags: feed.slice(1).map(mention)})
    } else if (isMentionFeed(feed)) {
      return makeList({kind: NAMED_PEOPLE, tags: feed.slice(2).map(mention)})
    } else if (isRelayFeed(feed)) {
      return makeList({kind: NAMED_RELAYS, tags: feed.slice(1).map(url => ["r", url])})
    } else if (isTopicFeed(feed)) {
      return makeList({
        kind: NAMED_TOPICS,
        tags: feed.slice(2).map(topic => ["t", topic]),
      })
    } else {
      throw new Error(`Invalid feed type ${feed[0]} passed to FeedFormSaveAsList`)
    }
  })()

  const openForm = () => {
    formIsOpen = true
  }

  const closeForm = event => {
    formIsOpen = false

    if (event) {
      onChange(makeListFeed({addresses: [getAddress(event)]}))
    }
  }

  let formIsOpen = false
</script>

<div class="flex flex-col items-end">
  <Anchor underline class="text-neutral-500" on:click={openForm}>Save selection as list</Anchor>
  {#if formIsOpen}
    <div class="relative w-full">
      <Popover2 onClose={closeForm}>
        <Card class="mt-2 shadow-xl">
          <ListForm {list} exit={closeForm} hide={["type", "tags"]} />
        </Card>
      </Popover2>
    </div>
  {/if}
</div>
