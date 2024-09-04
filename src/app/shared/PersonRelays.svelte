<script lang="ts">
  import {uniq} from '@welshman/lib'
  import {appName} from 'src/partials/state'
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let urls
</script>

<FlexColumn>
  <p>Below are the relays this user publishes to. {appName} will automatically select some of these relays when loading notes from this person.</p>
  {#if urls.length === 0}
    <div class="pt-8 text-center">No relays found</div>
  {:else}
    <FlexColumn small>
      {#each uniq(urls) as url (url)}
        <RelayCard {url} />
      {/each}
    </FlexColumn>
  {/if}
</FlexColumn>
