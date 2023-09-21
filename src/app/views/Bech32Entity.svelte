<script lang="ts">
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {warn} from "src/util/logger"
  import {fromNostrURI} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import NaddrDetail from "src/app/views/NaddrDetail.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import {selectHints} from "src/engine"

  export let entity

  entity = fromNostrURI(entity)

  let type, data, relays

  onMount(() => {
    try {
      ;({type, data} = nip19.decode(entity) as {type: string; data: any})
      relays = selectHints(data.relays || [], 3)
    } catch (e) {
      warn(e)
    }
  })
</script>

{#if type === "nevent"}
  <NoteDetail note={{id: data.id}} {relays} />
{:else if type === "note"}
  <NoteDetail note={{id: data}} />
{:else if type === "naddr"}
  <NaddrDetail {...data} />
{:else if type === "nprofile"}
  <PersonDetail npub={nip19.npubEncode(data.pubkey)} {relays} />
{:else if type === "npub"}
  <PersonDetail npub={entity} />
{:else}
  <Content size="lg" class="text-center">
    <div>Sorry, we weren't able to find "{entity}".</div>
  </Content>
{/if}
