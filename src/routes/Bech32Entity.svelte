<script>
  import {objOf} from 'ramda'
  import {nip19} from 'nostr-tools'
  import Content from 'src/partials/Content.svelte'
  import NoteDetail from 'src/views/NoteDetail.svelte'
  import Person from 'src/routes/Person.svelte'

  export let entity

  const {type, data} = nip19.decode(entity)
  const relays = (data.relays || []).map(objOf('url'))
</script>

{#if type === "nevent"}
  <Content>
    <NoteDetail note={{id: data.id}} {relays} />
  </Content>
{:else if type === "note"}
  <Content>
    <NoteDetail note={{id: data}} />
  </Content>
{:else if type === "nprofile"}
  <Person npub={nip19.npubEncode(data.pubkey)} {relays} activeTab="notes" />
{:else if type === "npub"}
  <Person npub={entity} activeTab="notes" />
{/if}

