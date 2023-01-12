<script>
  import {nip19} from 'nostr-tools'
  import NoteDetail from 'src/routes/NoteDetail.svelte'

  export let entity

  const {type, data} = nip19.decode(entity)
</script>

<div class="py-4 max-w-xl m-auto">
  {#if type === "nevent"}
    <NoteDetail {...data} />
  {/if}
</div>

