<script lang="ts">
  import {Kind} from "@welshman/util"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"
  import {readFeed, listAsFeed} from "src/domain"
  import {repository, lists} from "src/engine"

  export let address

  const feed = address.startsWith(Kind.ListBookmarks)
    ? listAsFeed(lists.key(address).get())
    : readFeed(repository.getEvent(address))

  const exit = () => router.clearModals()
</script>

{#if feed}
  <FeedForm showDelete showSave {feed} {exit} />
{:else}
  <p class="text-center">Sorry, we weren't able to find that feed.</p>
{/if}
