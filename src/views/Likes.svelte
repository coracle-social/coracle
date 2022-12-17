<script>
  import {onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {uniqBy, identity, prop} from 'ramda'
  import {timedelta} from 'src/util/misc'
  import Note from "src/views/Note.svelte"
  import {findReply} from 'src/util/nostr'
  import relay from 'src/relay'

  export let author

  const filter = {kinds: [7], authors: [author]}
  const delta = timedelta(1, 'days')

  let notes

  onDestroy(relay.scroller(filter, delta, async chunk => {
    notes = relay.lq(async () => {
      const notes = await Promise.all(chunk.map(r => relay.findNote(findReply(r))))

      return uniqBy(prop('id'), notes.filter(identity))
    })
  }))
</script>

{#if $notes}
<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each $notes as n (n.id)}
    <li><Note note={n} depth={1} /></li>
  {:else}
  <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
  {/each}
</ul>
{/if}

