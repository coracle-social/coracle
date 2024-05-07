<script lang="ts">
  import {Kind} from '@welshman/util'
  import Anchor from 'src/partials/Anchor.svelte'
  import FeedForm from 'src/app/shared/FeedForm.svelte'
  import {router} from 'src/app/util'
  import {readFeed, listAsFeed} from 'src/domain'
  import {repository, lists} from 'src/engine'

  export let address

  const feed = address.startsWith(Kind.ListBookmarks)
    ? listAsFeed(lists.key(address).get())
    : readFeed(repository.getEvent(address))

  const exit = () => router.pop()
</script>

{#if feed}
  <FeedForm {feed} onSave={exit}>
    <div slot="controls" let:remove let:save class="flex justify-between">
      <Anchor button on:click={exit}>Cancel</Anchor>
      <div class="flex gap-2">
        <Anchor button on:click={remove}>Delete</Anchor>
        <Anchor button accent on:click={save}>Save</Anchor>
      </div>
    </div>
  </FeedForm>
{:else}
  <p class="text-center">Sorry, we weren't able to find that feed.</p>
{/if}
