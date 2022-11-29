<script>
  import {onMount} from 'svelte'
  import {find, propEq} from 'ramda'
  import {notesCursor} from "src/state/app"
  import {user} from "src/state/user"
  import Note from 'src/partials/Note.svelte'

  export let note

  let onScroll

  onMount(async () => {
    const cursor = await notesCursor(
      [{ids: [note.id]},
       {'#e': [note.id]},
       // We can't target reaction deletes by e tag, so get them
       // all so we can support toggling like/flags for our user
       {kinds: [5], authors: $user ? [$user.pubkey] : []}],
      {isInModal: true}
    )

    cursor.notes.subscribe($notes => {
      note = find(propEq('id', note.id), $notes) || note
    })

    onScroll = cursor.onScroll

    return cursor.unsub
  })
</script>

{#if note.pubkey}
<Note showEntire note={note} />
{#each note.replies as r (r.id)}
  <div class="ml-4 border-l border-solid border-medium">
    <Note interactive invertColors isReply note={r} />
  {#each r.replies as r2 (r2.id)}
    <div class="ml-4 border-l border-solid border-medium">
      <Note interactive invertColors isReply note={r2} />
    {#each r2.replies as r3 (r3.id)}
      <div class="ml-4 border-l border-solid border-medium">
        <Note interactive invertColors isReply note={r3} />
      </div>
    {/each}
    </div>
  {/each}
  </div>
{/each}
{/if}
