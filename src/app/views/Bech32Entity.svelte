<script lang="ts">
  import {nip19} from "nostr-tools"
  import Content from "src/partials/Content.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import GroupDetail from "src/app/views/GroupDetail.svelte"
  import EventDetail from "src/app/views/EventDetail.svelte"

  export let entity, type, data, relays
</script>

{#if type === "nevent"}
  <NoteDetail eid={data.id} {relays} />
{:else if type === "note"}
  <NoteDetail eid={data} {relays} />
{:else if type === "naddr"}
  {#if [35834, 34550].includes(data.kind)}
    <GroupDetail address={data} relays={data.relays} activeTab="notes" />
  {:else if data.kind === 31923}
    <EventDetail address={data} relays={data.relays} />
  {:else}
    <NoteDetail {...data} />
  {/if}
{:else if type === "nrelay"}
  <RelayDetail url={data} />
{:else if type === "nprofile"}
  <PersonDetail npub={nip19.npubEncode(data.pubkey)} pubkey={data.pubkey} {relays} />
{:else if type === "npub"}
  <PersonDetail npub={nip19.npubEncode(data)} pubkey={data} />
{:else}
  <Content size="lg" class="text-center">
    <div>Sorry, we weren't able to find "{entity}".</div>
  </Content>
{/if}
