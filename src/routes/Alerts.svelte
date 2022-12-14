<script>
  import {onMount} from 'svelte'
  import {propEq} from 'ramda'
  import {createMap} from 'hurdak/lib/hurdak'
  import {now} from 'src/util/misc'
  import {alerts, annotateNotes} from 'src/state/app'
  import Note from 'src/partials/Note.svelte'

  let notesById

  onMount(() => {
    // Clear notification badge
    alerts.set({...$alerts, since: now()})

    annotateNotes($alerts.items.filter(propEq('kind', 1))).then($notes => {
      notesById = createMap('id', $notes)
    })
  })
</script>

{#each $alerts.items as e (e.id)}
{#if e.kind === 1 && notesById}
<Note interactive note={notesById[e.id]} />
{:else if e.kind === 7}
hi
{/if}
{:else}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    No recent activity found.
  </div>
</div>
{/each}

