<script lang="ts">
  import {getAddress} from "@welshman/util"
  import FeedCard from "src/app/shared/FeedCard.svelte"

  export let note
  export let isQuote = false
</script>

{#if isQuote}
  <FeedCard address={getAddress(note)} />
{:else}
  <div class="flex gap-3">
    <div class="mx-[6px] hidden sm:block">
      <i class="fa fa-rss fa-lg" />
    </div>
    <FeedCard address={getAddress(note)} />
  </div>
{/if}
