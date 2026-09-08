<script lang="ts">
  import {
    isShareableRelayUrl,
    RELAYS,
    BLOCKED_RELAYS,
    SEARCH_RELAYS,
    MESSAGING_RELAYS,
  } from "@welshman/util"
  import {BlockedRelayList, MessagingRelayList, RelayList, SearchRelayList} from "@welshman/domain"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {reader} from "src/engine/core"

  export let note
  export let kind: 10002 | 10006 | 10007 | 10050 = RELAYS

  const readUrls = {
    [RELAYS]: () => reader(RelayList)(note).urls(),
    [BLOCKED_RELAYS]: () => reader(BlockedRelayList)(note).urls(),
    [SEARCH_RELAYS]: () => reader(SearchRelayList)(note).urls(),
    [MESSAGING_RELAYS]: () => reader(MessagingRelayList)(note).urls(),
  }

  const urls = readUrls[kind]().filter(isShareableRelayUrl)
</script>

<FlexColumn small>
  {#if kind === RELAYS}
    <p>New relay selections:</p>
  {:else if kind === BLOCKED_RELAYS}
    <p>New blocked relay selections:</p>
  {:else if kind === SEARCH_RELAYS}
    <p>New searched relay selections:</p>
  {:else if kind === MESSAGING_RELAYS}
    <p>New messaging relay selections:</p>
  {/if}
  {#each urls as url}
    <RelayCard {url} />
  {/each}
</FlexColumn>
