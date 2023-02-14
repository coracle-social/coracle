<script lang="ts">
  import {objOf} from 'ramda'
  import {onMount} from 'svelte'
  import {nip19} from 'nostr-tools'
  import Content from 'src/partials/Content.svelte'
  import NoteDetail from 'src/views/NoteDetail.svelte'
  import Person from 'src/routes/Person.svelte'
  import {getUserRelays} from 'src/agent/helpers'

  export let entity

  let type, data, relays

  onMount(() => {
    try {
      ({type, data} = nip19.decode(entity) as {type: string, data: any})
      relays = (data.relays || []).map(objOf('url')).concat(getUserRelays())
    } catch (e) {
      // pass
    }
  })
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
{:else}
  <Content size="lg" class="text-center">
    <div>Sorry, we weren't able to find "{entity}".</div>
  </Content>
{/if}

