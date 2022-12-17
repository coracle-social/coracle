<script>
  import relay from 'src/relay'
  import Note from 'src/views/Note.svelte'

  export let note

  const observable = relay.lq(() => relay.findNote(note.id, {showEntire: true}))
</script>

{#if $observable}
<div n:fly={{y: 20}}>
  <Note showParent invertColors anchorId={note.id} note={$observable} depth={2} />
</div>
{/if}
