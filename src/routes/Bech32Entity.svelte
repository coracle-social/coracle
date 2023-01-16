<script>
  import {objOf} from 'ramda'
  import {nip19} from 'nostr-tools'
  import NoteDetail from 'src/views/NoteDetail.svelte'
  import Person from 'src/routes/Person.svelte'

  export let entity

  const {type, data} = nip19.decode(entity)
  const relays = (data.relays || []).map(objOf('url'))
</script>

{#if type === "nevent"}
  <NoteDetail note={{id: data.id}} {relays} />
{:else if type === "note"}
  <NoteDetail note={{id: data}} />
{:else if type === "nprofile"}
  <Person npub={nip19.npubEncode(data.pubkey)} {relays} activeTab="notes" />
{:else if type === "npub"}
  <Person npub={entity} activeTab="notes" />
{/if}

