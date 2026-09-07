<script lang="ts">
  import {NAMED_BOOKMARKS} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"
  import {readFeed, mapListToFeed, readUserList} from "src/domain"
  import {deriveEvent} from "src/engine"

  export let address

  const event = deriveEvent(address)

  const exit = () => router.clearModals()

  // Reading a list decrypts it, so this is asynchronous now
  const getFeed = async (e: TrustedEvent) =>
    address.startsWith(NAMED_BOOKMARKS) ? mapListToFeed(await readUserList(e)) : readFeed(e)
</script>

{#if $event}
  {#await getFeed($event) then feed}
    <FeedForm showDelete showSave {feed} {exit} />
  {/await}
{:else}
  <p class="text-center">Sorry, we weren't able to find that feed.</p>
{/if}
