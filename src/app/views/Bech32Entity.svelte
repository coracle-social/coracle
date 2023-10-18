<script lang="ts">
  import {nip19} from "nostr-tools"
  import {Naddr} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import GroupDetail from "src/app/views/GroupDetail.svelte"

  export let entity, type, data, relays
</script>

{#if type === "nevent"}
  <NoteDetail eid={data.id} {relays} />
{:else if type === "note"}
  <NoteDetail eid={data} {relays} />
{:else if type === "naddr"}
  {#if data.kind === 34550}
    <GroupDetail address={Naddr.decode(entity).asTagValue()} activeTab="notes" />
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
