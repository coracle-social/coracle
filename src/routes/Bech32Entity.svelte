<script>
  import {nip19} from 'nostr-tools'
  import NoteDetail from 'src/views/NoteDetail.svelte'

  export let entity

  const {type, data} = nip19.decode(entity)
</script>

<div class="py-4 max-w-xl m-auto">
  {#if type === "nevent"}
    <NoteDetail note={{id: data.id}} relays={data.relays} />
  {/if}
</div>

