<script>
  import {onDestroy} from 'svelte'
  import {createScroller} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import Note from "src/partials/Note.svelte"
  import relay from 'src/relay'

  export let loadNotes

  let notes
  let limit = 0

  const scroller = createScroller(async () => {
    limit += 20

    notes = relay.lq(() => loadNotes(limit))
  })

  onDestroy(() => {
    scroller.stop()
  })
</script>

{#if notes}
<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($notes || []) as n (n.id)}
    <li><Note note={n} depth={2} /></li>
  {/each}
</ul>
{/if}

<Spinner />
