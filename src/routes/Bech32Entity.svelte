<script>
  import {nip19} from 'nostr-tools'
  import {getRelays} from 'src/agent'
  import NoteDetail from 'src/views/NoteDetail.svelte'
  import Person from 'src/routes/Person.svelte'

  export let entity

  const {type, data} = nip19.decode(entity)
</script>

<div class="py-4 max-w-xl m-auto">
  {#if type === "nevent"}
    <NoteDetail note={{id: data.id}} relays={data.relays} />
  {:else if type === "note"}
    <NoteDetail note={{id: data}} relays={getRelays()} />
  {:else if type === "nprofile"}
    <Person npub={nip19.npubEncode(data.pubkey)} relays={data.relays} activeTab="notes" />
  {:else if type === "npub"}
    <Person npub={entity} activeTab="notes" />
  {/if}
</div>

