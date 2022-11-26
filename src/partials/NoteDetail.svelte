<script>
  import {onMount} from 'svelte'
  import {find, propEq} from 'ramda'
  import {findNotes} from "src/state/app"
  import {channels} from "src/state/nostr"
  import {user} from "src/state/user"
  import Note from 'src/partials/Note.svelte'

  export let note

  onMount(() => {
    return findNotes(
      channels.watcher,
      [{ids: [note.id]},
       {'#e': [note.id]},
       // We can't target reaction deletes by e tag, so get them
       // all so we can support toggling like/flags for our user
       {kinds: [5], authors: $user ? [$user.pubkey] : []}],
      $notes => {
        note = find(propEq('id', note.id), $notes) || note
      }
    )
  })
</script>

{#if note.pubkey}
<Note note={note} />
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
