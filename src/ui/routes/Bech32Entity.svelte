<script lang="ts">
  import {objOf, last} from "ramda"
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {warn} from "src/util/logger"
  import Content from "src/ui/partials/Content.svelte"
  import NoteDetail from "src/ui/views/notes/NoteDetail.svelte"
  import PersonDetail from "src/ui/routes/PersonDetail.svelte"
  import {sampleRelays} from "src/agent/relays"

  export let entity

  entity = last(entity.split(":"))

  let type, data, relays

  onMount(() => {
    try {
      ;({type, data} = nip19.decode(entity) as {type: string; data: any})
      relays = sampleRelays((data.relays || []).map(objOf("url")))
    } catch (e) {
      warn(e)
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
  <PersonDetail npub={nip19.npubEncode(data.pubkey)} {relays} activeTab="notes" />
{:else if type === "npub"}
  <PersonDetail npub={entity} activeTab="notes" />
{:else}
  <Content size="lg" class="text-center">
    <div>Sorry, we weren't able to find "{entity}".</div>
  </Content>
{/if}
